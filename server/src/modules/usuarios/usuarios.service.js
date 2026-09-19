import bcrypt from 'bcryptjs';
import { withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../shared/httpError.js';
import { ESTADOS } from '../../shared/estados.js';
import { registrar } from '../auditoria/auditoria.service.js';
import { ROLES } from '../../shared/roles.js';
import * as cursosRepository from '../cursos/cursos.repository.js';
import * as repository from './usuarios.repository.js';

export async function listar(filtros) {
  return repository.listar(filtros);
}

export async function obtener(id) {
  const usuario = await repository.buscarPorId(id);
  if (!usuario) {
    throw HttpError.notFound('El usuario no existe');
  }
  return usuario;
}

export async function crear({ datos, vigenciaId, responsable }) {
  const existente = await repository.buscarPorIdentificacion(datos.identificacion);
  if (existente) {
    throw HttpError.conflict('Ya existe un usuario con esa identificacion');
  }

  const correoExistente = await repository.buscarPorEmail(datos.email);
  if (correoExistente) {
    throw HttpError.conflict('Ya existe un usuario con ese correo');
  }

  // El usuario para iniciar sesion se deriva del correo institucional, no se
  // vuelve a escribir a mano. La columna usuario admite hasta 20 caracteres,
  // asi que se usa la parte antes del @ y se recorta si hace falta.
  const usuario = datos.email.split('@')[0].slice(0, 20);

  const usuarioExistente = await repository.buscarPorUsuario(usuario);
  if (usuarioExistente) {
    throw HttpError.conflict('Ya existe un usuario derivado de ese correo, use un correo distinto');
  }

  // Un estudiante solo aparece en el directorio si queda enlazado a un curso en
  // la vigencia actual (usuario_curso_vigencia), asi que se valida y se
  // matricula de una vez, en la misma vigencia que el administrador tenia
  // seleccionada al crearlo.
  let curso = null;
  if (datos.rol === ROLES.ESTUDIANTE) {
    curso = await cursosRepository.buscarPorId(datos.cursoId);
    if (!curso) {
      throw HttpError.notFound('El curso seleccionado no existe');
    }
  }

  const contrasena = await bcrypt.hash(datos.identificacion, env.bcryptRounds);

  const id = await withTransaction(async (connection) => {
    const nuevoId = await repository.crear(
      { ...datos, usuario, contrasena, idEstado: ESTADOS.ACTIVO },
      connection
    );

    if (curso) {
      await repository.matricular({ cursoId: curso.id, vigenciaId, usuarioId: nuevoId }, connection);
    }

    await registrar(
      {
        responsable,
        accion: 'CREACION',
        entidad: 'usuario',
        entidadId: nuevoId,
        detalle: curso
          ? `Creacion de ${usuario} con rol ${datos.rol}, matriculado en el curso ${curso.grado} (vigencia ${vigenciaId})`
          : `Creacion de ${usuario} con rol ${datos.rol}`
      },
      connection
    );

    return nuevoId;
  });

  return repository.buscarPorId(id);
}

export async function crearLote({ cursoId, estudiantes, vigenciaId, responsable }) {
  const curso = await cursosRepository.buscarPorId(cursoId);
  if (!curso) {
    throw HttpError.notFound('El curso seleccionado no existe');
  }

  // El usuario para iniciar sesion se deriva del correo, igual que en la
  // creacion individual (ver crear() mas arriba), asi que se calcula antes de
  // validar para poder detectar choques entre filas del mismo lote.
  const filas = estudiantes.map((estudiante, indice) => ({
    ...estudiante,
    fila: indice + 1,
    usuario: estudiante.email.split('@')[0].slice(0, 20)
  }));

  const errores = [];
  const identificacionesVistas = new Set();
  const correosVistos = new Set();
  const usuariosVistos = new Set();

  filas.forEach((fila) => {
    const mensajes = [];
    if (identificacionesVistas.has(fila.identificacion)) {
      mensajes.push(`La identificacion "${fila.identificacion}" esta repetida en el lote`);
    }
    if (correosVistos.has(fila.email)) {
      mensajes.push(`El correo "${fila.email}" esta repetido en el lote`);
    }
    if (usuariosVistos.has(fila.usuario)) {
      mensajes.push(`El usuario derivado de "${fila.email}" coincide con el de otra fila del lote, use un correo distinto`);
    }
    if (mensajes.length) {
      errores.push({ fila: fila.fila, mensajes });
    }
    identificacionesVistas.add(fila.identificacion);
    correosVistos.add(fila.email);
    usuariosVistos.add(fila.usuario);
  });

  const ocupados = await repository.buscarOcupados({
    identificaciones: filas.map((fila) => fila.identificacion),
    correos: filas.map((fila) => fila.email),
    usuarios: filas.map((fila) => fila.usuario)
  });

  filas.forEach((fila) => {
    const mensajes = [];
    if (ocupados.identificaciones.has(fila.identificacion)) {
      mensajes.push(`Ya existe un usuario con la identificacion "${fila.identificacion}"`);
    }
    if (ocupados.correos.has(fila.email)) {
      mensajes.push(`Ya existe un usuario con el correo "${fila.email}"`);
    }
    if (ocupados.usuarios.has(fila.usuario)) {
      mensajes.push(`Ya existe un usuario derivado del correo "${fila.email}", use un correo distinto`);
    }
    if (mensajes.length) {
      errores.push({ fila: fila.fila, mensajes });
    }
  });

  if (errores.length) {
    throw HttpError.unprocessable('El lote tiene errores y no se guarda de forma parcial', {
      errores: errores.sort((a, b) => a.fila - b.fila)
    });
  }

  const ids = await withTransaction(async (connection) => {
    const creados = [];

    for (const fila of filas) {
      const contrasena = await bcrypt.hash(fila.identificacion, env.bcryptRounds);
      const nuevoId = await repository.crear(
        {
          identificacion: fila.identificacion,
          usuario: fila.usuario,
          contrasena,
          nombre: fila.nombre,
          apellido: fila.apellido,
          email: fila.email,
          idEstado: ESTADOS.ACTIVO,
          rol: ROLES.ESTUDIANTE
        },
        connection
      );
      await repository.matricular({ cursoId: curso.id, vigenciaId, usuarioId: nuevoId }, connection);
      creados.push(nuevoId);
    }

    await registrar(
      {
        responsable,
        accion: 'CARGA_MANUAL_ACEPTADA',
        entidad: 'usuario',
        entidadId: null,
        detalle: `${creados.length} estudiantes cargados manualmente en el curso ${curso.grado} (vigencia ${vigenciaId})`
      },
      connection
    );

    return creados;
  });

  return { cursoId: curso.id, curso: curso.grado, anio: vigenciaId, creados: ids.length };
}

export async function actualizar({ id, datos, responsable }) {
  await obtener(id);

  await withTransaction(async (connection) => {
    await repository.actualizar(id, datos, connection);
    await registrar(
      {
        responsable,
        accion: 'ACTUALIZACION',
        entidad: 'usuario',
        entidadId: id,
        detalle: `Actualizacion de ${Object.keys(datos).join(', ')}`
      },
      connection
    );
  });

  return repository.buscarPorId(id);
}

export async function cambiarEstado({ id, activo, responsable }) {
  const usuario = await obtener(id);

  if (usuario.id === responsable.id && !activo) {
    throw HttpError.unprocessable('No puede bloquear su propia cuenta');
  }

  const idEstado = activo ? ESTADOS.ACTIVO : ESTADOS.BLOQUEADO;

  await withTransaction(async (connection) => {
    await repository.cambiarEstado(id, idEstado, connection);
    await registrar(
      {
        responsable,
        accion: activo ? 'ACTIVACION' : 'BLOQUEO',
        entidad: 'usuario',
        entidadId: id,
        detalle: `${activo ? 'Activacion' : 'Bloqueo'} de ${usuario.usuario}`
      },
      connection
    );
  });

  return repository.buscarPorId(id);
}

export async function restablecerContrasena({ id, responsable }) {
  const usuario = await obtener(id);
  const contrasena = await bcrypt.hash(usuario.identificacion, env.bcryptRounds);

  await withTransaction(async (connection) => {
    await connection.execute('UPDATE usuario SET contrasena = ? WHERE id = ?', [contrasena, id]);
    await registrar(
      {
        responsable,
        accion: 'RESTABLECIMIENTO_CONTRASENA',
        entidad: 'usuario',
        entidadId: id,
        detalle: `Contrasena de ${usuario.usuario} restablecida a su identificacion`
      },
      connection
    );
  });
}
