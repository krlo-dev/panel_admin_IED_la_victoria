import bcrypt from 'bcryptjs';
import { withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../shared/httpError.js';
import { ESTADOS } from '../../shared/estados.js';
import { ROLES } from '../../shared/roles.js';
import { siguienteId } from '../../shared/ids.js';
import { registrar } from '../auditoria/auditoria.service.js';
import { validarFormato } from './cargas.validador.js';
import * as repository from './cargas.repository.js';

async function validarContraBase(filas) {
  if (!filas.length) {
    return [];
  }

  const errores = [];

  const cursos = [...new Set(filas.map((fila) => fila.idCurso))];
  const disponibles = await repository.cursosExistentes(cursos);

  const ocupados = await repository.buscarOcupados({
    identificaciones: filas.map((fila) => fila.identificacion),
    usuarios: filas.map((fila) => fila.usuario),
    correos: filas.map((fila) => fila.email)
  });

  filas.forEach((fila) => {
    const mensajes = [];

    if (!disponibles.has(fila.idCurso)) {
      mensajes.push(`El curso ${fila.idCurso} no existe`);
    }
    if (ocupados.identificaciones.has(fila.identificacion)) {
      mensajes.push(`La identificación "${fila.identificacion}" ya está registrada`);
    }
    if (ocupados.usuarios.has(fila.usuario)) {
      mensajes.push(`El usuario "${fila.usuario}" ya está registrado`);
    }
    if (ocupados.correos.has(fila.email)) {
      mensajes.push(`El correo "${fila.email}" ya está registrado`);
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

      await repository.matricularEstudiante(
        {
          id,
          identificacion: fila.identificacion,
          usuario: fila.usuario,
          contrasena,
          nombre: fila.nombre,
          apellido: fila.apellido,
          email: fila.email,
          idEstado: ESTADOS.ACTIVO,
          rol: ROLES.ESTUDIANTE,
          idCurso: fila.idCurso,
          idVigencia: vigencia.id
        },
        connection
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
