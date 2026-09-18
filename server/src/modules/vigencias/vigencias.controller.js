import { asyncHandler } from '../../shared/asyncHandler.js';
import { creado, ok } from '../../shared/respuesta.js';
import * as service from './vigencias.service.js';

export const listar = asyncHandler(async (_req, res) => {
  ok(res, await service.listar());
});

export const crear = asyncHandler(async (req, res) => {
  creado(res, await service.crear({ datos: req.body, responsable: req.usuario, ip: req.ip }));
});

export const activar = asyncHandler(async (req, res) => {
  ok(res, await service.activar({ id: req.params.id, responsable: req.usuario, ip: req.ip }));
});
