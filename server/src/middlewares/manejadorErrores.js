import { HttpError } from '../shared/httpError.js';
import { isProduction } from '../config/env.js';

const ERRORES_MYSQL = {
  ER_DUP_ENTRY: () => HttpError.conflict('El registro ya existe'),
  ER_NO_REFERENCED_ROW_2: () => HttpError.badRequest('Una de las referencias enviadas no existe'),
  ER_ROW_IS_REFERENCED_2: () => HttpError.conflict('El registro tiene informacion asociada')
};

export function manejadorErrores(error, req, res, _next) {
  let fallo = error;

  if (!(fallo instanceof HttpError) && ERRORES_MYSQL[fallo?.code]) {
    fallo = ERRORES_MYSQL[fallo.code]();
  }

  if (!(fallo instanceof HttpError)) {
    if (!isProduction) {
      console.error(error);
    }
    fallo = new HttpError(500, 'ERROR_INTERNO', 'Ocurrio un error inesperado en el servidor');
  }

  res.status(fallo.status).json({
    error: {
      codigo: fallo.code,
      mensaje: fallo.message,
      detalles: fallo.details ?? undefined
    }
  });
}
