import { queryOne } from '../config/db.js';
import { asyncHandler } from '../shared/asyncHandler.js';
import { HttpError } from '../shared/httpError.js';

const CLAVE_ACTIVA = 'vigencia_activa';

export async function vigenciaActiva() {
  return queryOne(
    `SELECT v.id, v.fecha_inicio AS fechaInicio, v.fecha_fin AS fechaFin
       FROM configuracion c
       JOIN vigencia v ON v.id = CAST(c.valor AS UNSIGNED)
      WHERE c.clave = ?
      LIMIT 1`,
    [CLAVE_ACTIVA]
  );
}

export const resolverVigencia = asyncHandler(async (req, _res, next) => {
  const solicitada = Number(req.query.anio ?? 0);

  const vigencia = solicitada
    ? await queryOne(
        'SELECT id, fecha_inicio AS fechaInicio, fecha_fin AS fechaFin FROM vigencia WHERE id = ? LIMIT 1',
        [solicitada]
      )
    : await vigenciaActiva();

  if (!vigencia) {
    throw HttpError.unprocessable('No hay una vigencia disponible para la consulta');
  }

  const activa = await vigenciaActiva();

  req.vigencia = {
    id: vigencia.id,
    anio: vigencia.id,
    activa: activa?.id === vigencia.id
  };

  next();
});
