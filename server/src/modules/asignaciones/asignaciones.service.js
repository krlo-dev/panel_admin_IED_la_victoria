import { withTransaction } from '../../config/db.js';
import { HttpError } from '../../shared/httpError.js';
import { registrar } from '../auditoria/auditoria.service.js';
import { buscarPorId } from '../cursos/cursos.repository.js';
import * as repository from './asignaciones.repository.js';

export async function listar(filtros) {
  return repository.listar(filtros);
}

export async function asignar({ cursoId, docenteId, vigenciaId, responsable }) {
  const curso = await buscarPorId(cursoId);
  if (!curso) {
    throw HttpError.notFound('El curso no existe');
  }

  const docente = await repository.docenteValido(docenteId);
  if (!docente) {
    throw HttpError.unprocessable('El usuario seleccionado no puede quedar a cargo de un curso');
  }

  if (await repository.existe({ cursoId, docenteId, vigenciaId })) {
    throw HttpError.conflict('El docente ya esta asignado a ese curso en la vigencia');
  }

  await withTransaction(async (connection) => {
    await repository.crear({ cursoId, docenteId, vigenciaId }, connection);
    await registrar(
      {
        responsable,
        accion: 'ASIGNACION_CURSO',
        entidad: 'usuario_curso_vigencia',
        entidadId: `${cursoId}-${vigenciaId}-${docenteId}`,
        detalle: `${docente.usuario} asignado al curso ${curso.grado} en la vigencia ${vigenciaId}`
      },
      connection
    );
  });

  return { cursoId, docenteId, vigenciaId };
}

export async function retirar({ cursoId, docenteId, vigenciaId, responsable }) {
  const eliminadas = await withTransaction(async (connection) => {
    const filas = await repository.eliminar({ cursoId, docenteId, vigenciaId }, connection);

    if (filas) {
      await registrar(
        {
          responsable,
          accion: 'RETIRO_CURSO',
          entidad: 'usuario_curso_vigencia',
          entidadId: `${cursoId}-${vigenciaId}-${docenteId}`,
          detalle: `Docente ${docenteId} retirado del curso ${cursoId} en la vigencia ${vigenciaId}`
        },
        connection
      );
    }

    return filas;
  });

  if (!eliminadas) {
    throw HttpError.notFound('La asignacion no existe');
  }
}
