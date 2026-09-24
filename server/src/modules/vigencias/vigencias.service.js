import { withTransaction } from '../../config/db.js';
import { HttpError } from '../../shared/httpError.js';
import { vigenciaActiva } from '../../middlewares/vigenciaActiva.js';
import { registrar } from '../auditoria/auditoria.service.js';
import * as repository from './vigencias.repository.js';

export async function listar() {
  const activa = await vigenciaActiva();
  const registros = await repository.listar();
  return registros.map((vigencia) => ({ ...vigencia, anio: vigencia.id, activa: vigencia.id === activa?.id }));
}

export async function crear({ datos, responsable }) {
  const existente = await repository.buscarPorId(datos.anio);
  if (existente) throw HttpError.conflict('La vigencia ya existe');
  if (datos.fechaFin < datos.fechaInicio) throw HttpError.badRequest('La fecha final no puede ser anterior a la inicial');
  await repository.crear({ anio: datos.anio, fechaInicio: datos.fechaInicio, fechaFin: datos.fechaFin });
  await registrar({
    responsable,
    accion: 'CREACION',
    entidad: 'vigencia',
    entidadId: datos.anio,
    detalle: `Vigencia ${datos.anio} creada`
  });
  return { id: datos.anio, anio: datos.anio, activa: false };
}

export async function activar({ id, responsable }) {
  const vigencia = await repository.buscarPorId(id);
  if (!vigencia) throw HttpError.notFound('La vigencia no existe');
  await withTransaction(async (connection) => {
    const afectados = await repository.activar(id, connection);
    if (!afectados) {
      throw HttpError.unprocessable(`No existe el parametro ${repository.CLAVE_ACTIVA} en la tabla configuracion`);
    }
    await registrar(
      {
        responsable,
        accion: 'ACTIVACION_VIGENCIA',
        entidad: 'vigencia',
        entidadId: id,
        detalle: `Vigencia activa cambiada a ${id}`
      },
      connection
    );
  });
  return { id, anio: id, activa: true };
}

export async function eliminar({ id, responsable }) {
  const vigencia = await repository.buscarPorId(id);
  if (!vigencia) throw HttpError.notFound('La vigencia no existe');

  const activa = await vigenciaActiva();
  if (activa?.id === id) {
    throw HttpError.conflict('No se puede eliminar la vigencia activa; active otra vigencia primero');
  }

  const tieneMatriculas = await repository.tieneMatriculas(id);
  if (tieneMatriculas) {
    throw HttpError.conflict(
      `La vigencia ${id} tiene estudiantes o docentes matriculados en algun curso y no se puede eliminar`
    );
  }

  await repository.eliminar(id);

  await registrar({
    responsable,
    accion: 'ELIMINACION_VIGENCIA',
    entidad: 'vigencia',
    entidadId: id,
    detalle: `Vigencia ${id} eliminada, sin matriculas`
  });
}
