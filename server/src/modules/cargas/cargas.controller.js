import { asyncHandler } from '../../shared/asyncHandler.js';
import { ok } from '../../shared/respuesta.js';
import { HttpError } from '../../shared/httpError.js';
import { ENCABEZADO_CSV } from './plantilla.js';
import * as service from './cargas.service.js';

export const descargarPlantilla = asyncHandler(async (_req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="plantilla_carga_masiva.csv"');
  res.send(`﻿${ENCABEZADO_CSV}`);
});

export const procesar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw HttpError.badRequest('Debe adjuntar el archivo CSV en el campo archivo');
  }

  const resumen = await service.procesar({
    archivo: req.file.originalname,
    contenido: req.file.buffer.toString('utf8'),
    vigencia: req.vigencia,
    responsable: req.usuario
  });

  ok(res, resumen);
});
