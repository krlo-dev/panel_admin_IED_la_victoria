import bcrypt from 'bcryptjs';
import { withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../shared/httpError.js';
import { ESTADOS } from '../../shared/estados.js';
import { registrar } from '../auditoria/auditoria.service.js';
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

export async function crear({ datos, responsable }) {
  const existente = await repository.buscarPorIdentificacion(datos.identificacion);
  if (existente) {
    throw HttpError.conflict('Ya existe un usuario con esa identificacion');
  }

  const contrasena = await bcrypt.hash(datos.identificacion, env.bcryptRounds);

  const id = await withTransaction(async (connection) => {
    const nuevoId = await repository.crear(
      { ...datos, contrasena, idEstado: ESTADOS.ACTIVO },
      connection
    );

    await registrar(
      {
        responsable,
        accion: 'CREACION',
        entidad: 'usuario',
        entidadId: nuevoId,
        detalle: `Creacion de ${datos.usuario} con rol ${datos.rol}`
      },
      connection
    );

    return nuevoId;
  });

  return repository.buscarPorId(id);
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
