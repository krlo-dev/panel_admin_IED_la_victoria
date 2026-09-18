import { queryOne } from '../config/db.js';
import { HttpError } from '../shared/httpError.js';
import { asyncHandler } from '../shared/asyncHandler.js';
import { verificarToken } from '../shared/token.js';
import { ESTADOS } from '../shared/estados.js';

function extraerToken(req) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7).trim();
}

export const autenticar = asyncHandler(async (req, _res, next) => {
  const token = extraerToken(req);
  if (!token) {
    throw HttpError.unauthorized('No se recibio el token de acceso');
  }

  let contenido;
  try {
    contenido = verificarToken(token);
  } catch {
    throw HttpError.unauthorized();
  }

  const usuario = await queryOne(
    `SELECT u.id,
            u.usuario,
            u.identificacion,
            u.nombre,
            u.apellido,
            u.email,
            u.id_estado AS idEstado,
            r.nombre AS rol
       FROM usuario u
       JOIN rol r ON r.id = u.id_rol
      WHERE u.id = ?
      LIMIT 1`,
    [contenido.sub]
  );

  if (!usuario) {
    throw HttpError.unauthorized('La cuenta ya no existe');
  }

  if (usuario.idEstado !== ESTADOS.ACTIVO) {
    throw HttpError.forbidden('La cuenta esta bloqueada');
  }

  req.usuario = usuario;
  next();
});
