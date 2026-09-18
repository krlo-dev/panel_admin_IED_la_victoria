import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../shared/httpError.js';
import { ESTADOS } from '../../shared/estados.js';
import { ROLES } from '../../shared/roles.js';
import { siguienteId } from '../../shared/ids.js';
import { registrar } from '../auditoria/auditoria.service.js';
import { validarFormato } from './cargas.validador.js';

async function validarContraBase(filas) {
  if (!filas.length) {
    return [];
  }

  const errores = [];

  const cursos = [...new Set(filas.map((fila) => fila.idCurso))];
  const existentes = await query(
    `SELECT DISTINCT c.id
       FROM curso c
      WHERE c.id IN (${cursos.map(() => '?').join(', ')})`,
    cursos
  );
  const disponibles = new Set(existentes.map((curso) => curso.id));

  const ocupados = await query(
    `SELECT identificacion, usuario, email
       FROM usuario
      WHERE identificacion IN (${filas.map(() => '?').join(', ')})
         OR usuario IN (${filas.map(() => '?').join(', ')})
         OR email IN (${filas.map(() => '?').join(', ')})`,
    [
      ...filas.map((fila) => fila.identificacion),
      ...filas.map((fila) => fila.usuario),
      ...filas.map((fila) => fila.email)
    ]
  );

  const identificaciones = new Set(ocupados.map((fila) => fila.identificacion));
  const usuarios = new Set(ocupados.map((fila) => fila.usuario));
  const correos = new Set(ocupados.map((fila) => fila.email));

  filas.forEach((fila) => {
    const mensajes = [];

    if (!disponibles.has(fila.idCurso)) {
      mensajes.push(`El curso ${fila.idCurso} no existe`);
    }
    if (identificaciones.has(fila.identificacion)) {
      mensajes.push('La identificación ya está registrada');
    }
    if (usuarios.has(fila.usuario)) {
      mensajes.push('El usuario ya está registrado');
    }
    if (correos.has(fila.email)) {
      mensajes.push('El correo ya está registrado');
    }

    if (mensajes.length) {
      errores.push({ fila: fila.fila, mensajes });
    }
  });

  return errores;
}

export async function procesar({ archivo, contenido, vigencia, responsable }) {
  const formato = validarFormato({ contenido, anioVigencia: vigencia.anio });
  const errores = [...formato.errores, ...(await validarContraBase(formato.filas))];

  if (errores.length) {
    await registrar({
      responsable,
      accion: 'CARGA_MASIVA_RECHAZADA',
      entidad: 'usuario',
      entidadId: null,
      detalle: `Archivo ${archivo} rechazado con ${errores.length} filas con error`
    });

    throw HttpError.unprocessable('El archivo tiene errores y no se procesa de forma parcial', {
      errores: errores.sort((a, b) => a.fila - b.fila)
    });
  }

  const creados = await withTransaction(async (connection) => {
    let id = await siguienteId(connection, 'usuario');
    const ids = [];

    for (const fila of formato.filas) {
      const contrasena = await bcrypt.hash(fila.identificacion, env.bcryptRounds);

      await connection.execute(
        `INSERT INTO usuario (id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT id FROM rol WHERE nombre = ?))`,
        [
          id,
          fila.identificacion,
          fila.usuario,
          contrasena,
          fila.nombre,
          fila.apellido,
          fila.email,
          ESTADOS.ACTIVO,
          ROLES.ESTUDIANTE
        ]
      );

      await connection.execute(
        'INSERT INTO usuario_curso_vigencia (id_curso, id_vigencia, id_usuario) VALUES (?, ?, ?)',
        [fila.idCurso, vigencia.id, id]
      );

      ids.push(id);
      id += 1;
    }

    await registrar(
      {
        responsable,
        accion: 'CARGA_MASIVA_ACEPTADA',
        entidad: 'usuario',
        entidadId: null,
        detalle: `Archivo ${archivo} con ${ids.length} estudiantes cargados en la vigencia ${vigencia.anio}`
      },
      connection
    );

    return ids;
  });

  return { archivo, anio: vigencia.anio, creados: creados.length };
}
