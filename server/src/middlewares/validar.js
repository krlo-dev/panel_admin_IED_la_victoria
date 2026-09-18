import { HttpError } from '../shared/httpError.js';

function formatear(error) {
  return error.issues.map((issue) => ({
    campo: issue.path.join('.'),
    mensaje: issue.message
  }));
}

export function validar({ body, params, query }) {
  return (req, _res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      if (query) {
        req.validated = { ...(req.validated ?? {}), query: query.parse(req.query) };
      }
      next();
    } catch (error) {
      if (error?.issues) {
        next(HttpError.badRequest('Los datos enviados no son validos', formatear(error)));
        return;
      }
      next(error);
    }
  };
}
