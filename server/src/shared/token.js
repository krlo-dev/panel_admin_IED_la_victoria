import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function emitirToken(usuario) {
  return jwt.sign({ sub: usuario.id, rol: usuario.rol }, env.jwt.secreto, {
    expiresIn: env.jwt.expiraEn
  });
}

export function verificarToken(token) {
  return jwt.verify(token, env.jwt.secreto);
}
