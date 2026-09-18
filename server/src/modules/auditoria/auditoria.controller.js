import { asyncHandler } from '../../shared/asyncHandler.js';
import { ok } from '../../shared/respuesta.js';
import * as service from './auditoria.service.js';

export const listar = asyncHandler(async (req, res) => {
  const { pagina, limite, entidad, accion, desde, hasta } = req.validated.query;
  const { registros, total } = await service.listar({ entidad, accion, desde, hasta, pagina, limite });
  ok(res, registros, { pagina, limite, total });
});
