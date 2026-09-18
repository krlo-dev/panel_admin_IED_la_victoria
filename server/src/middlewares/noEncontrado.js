import { HttpError } from '../shared/httpError.js';

export function noEncontrado(req, _res, next) {
  next(HttpError.notFound(`La ruta ${req.method} ${req.originalUrl} no existe`));
}
