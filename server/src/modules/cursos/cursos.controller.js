import { asyncHandler } from '../../shared/asyncHandler.js';
import { ok } from '../../shared/respuesta.js';
import * as service from './cursos.service.js';

export const listar = asyncHandler(async (req, res) => {
  const { busqueda } = req.validated.query;
  const cursos = await service.listar({ vigenciaId: req.vigencia.id, busqueda, usuario: req.usuario });
  ok(res, cursos, { anio: req.vigencia.anio, total: cursos.length });
});

export const mios = asyncHandler(async (req, res) => {
  ok(res, await service.mios({ usuario: req.usuario, vigenciaId: req.vigencia.id }), {
    anio: req.vigencia.anio
  });
});

export const obtener = asyncHandler(async (req, res) => {
  ok(res, await service.obtener({ id: req.params.id, vigenciaId: req.vigencia.id, usuario: req.usuario }));
});
