import { asyncHandler } from '../../shared/asyncHandler.js';
import { creado, ok, sinContenido } from '../../shared/respuesta.js';
import * as service from './asignaciones.service.js';

export const listar = asyncHandler(async (req, res) => {
  const { curso } = req.validated.query;
  const registros = await service.listar({ vigenciaId: req.vigencia.id, curso });
  ok(res, registros, { anio: req.vigencia.anio, total: registros.length });
});

export const asignar = asyncHandler(async (req, res) => {
  const asignacion = await service.asignar({
    cursoId: req.body.cursoId,
    docenteId: req.body.docenteId,
    vigenciaId: req.vigencia.id,
    responsable: req.usuario
  });
  creado(res, asignacion);
});

export const retirar = asyncHandler(async (req, res) => {
  await service.retirar({
    cursoId: req.params.cursoId,
    docenteId: req.params.docenteId,
    vigenciaId: req.vigencia.id,
    responsable: req.usuario
  });
  sinContenido(res);
});
