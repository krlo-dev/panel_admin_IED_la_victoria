import { HttpError } from '../shared/httpError.js';
import { tieneRol } from '../shared/roles.js';

export function autorizar(...permitidos) {
  return (req, _res, next) => {
    if (!req.usuario) {
      next(HttpError.unauthorized());
      return;
    }

    if (!tieneRol(req.usuario.rol, permitidos)) {
      next(HttpError.forbidden());
      return;
    }

    next();
  };
}
