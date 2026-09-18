export class HttpError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details = null) {
    return new HttpError(400, 'SOLICITUD_INVALIDA', message, details);
  }

  static unauthorized(message = 'Sesion no valida o expirada') {
    return new HttpError(401, 'NO_AUTENTICADO', message);
  }

  static forbidden(message = 'No tiene permisos para esta accion') {
    return new HttpError(403, 'NO_AUTORIZADO', message);
  }

  static notFound(message = 'El recurso solicitado no existe') {
    return new HttpError(404, 'NO_ENCONTRADO', message);
  }

  static conflict(message, details = null) {
    return new HttpError(409, 'CONFLICTO', message, details);
  }

  static unprocessable(message, details = null) {
    return new HttpError(422, 'REGLA_DE_NEGOCIO', message, details);
  }
}
