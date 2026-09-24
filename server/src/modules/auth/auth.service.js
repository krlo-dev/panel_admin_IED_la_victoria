import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { HttpError } from '../../shared/httpError.js';
import { emitirToken } from '../../shared/token.js';
import { ESTADOS } from '../../shared/estados.js';
import { vigenciaActiva } from '../../middlewares/vigenciaActiva.js';
import { registrar } from '../auditoria/auditoria.service.js';
import * as repository from './auth.repository.js';

export async function iniciarSesion({ usuario, contrasena }) {
  const encontrado = await repository.buscarParaLogin(usuario);
  if (!encontrado) throw HttpError.unauthorized('El usuario o la contraseña no son correctos');
  const coincide = encontrado.contrasena.startsWith('$2')
    ? await bcrypt.compare(contrasena, encontrado.contrasena)
    : contrasena === encontrado.contrasena;
  if (!coincide) throw HttpError.unauthorized('El usuario o la contraseña no son correctos');
  if (encontrado.idEstado !== ESTADOS.ACTIVO) throw HttpError.forbidden('La cuenta se encuentra bloqueada');
  const perfil = { ...encontrado };
  delete perfil.contrasena;
  await registrar({
    responsable: perfil,
    accion: 'INICIO_SESION',
    entidad: 'usuario',
    entidadId: perfil.id,
    detalle: `Ingreso del usuario administrador ${perfil.usuario}`
  });
  return { token: emitirToken(perfil), usuario: perfil };
}

export async function perfil(usuario) {
  return { usuario, vigencia: await vigenciaActiva() };
}

export async function cambiarContrasena({ usuario, actual, nueva }) {
  const fila = await repository.buscarContrasena(usuario.id);
  const actualValida = fila?.contrasena?.startsWith('$2')
    ? await bcrypt.compare(actual, fila.contrasena)
    : actual === fila?.contrasena;
  if (!fila || !actualValida) throw HttpError.unauthorized('La contraseña actual no es correcta');
  const hash = await bcrypt.hash(nueva, env.bcryptRounds);
  await repository.actualizarContrasena(usuario.id, hash);
  await registrar({
    responsable: usuario,
    accion: 'CAMBIO_CONTRASENA',
    entidad: 'usuario',
    entidadId: usuario.id,
    detalle: `Cambio de contraseña de ${usuario.usuario}`
  });
}

export async function cerrarSesion(usuario) {
  await registrar({
    responsable: usuario,
    accion: 'CIERRE_SESION',
    entidad: 'usuario',
    entidadId: usuario.id,
    detalle: `Cierre de sesión de ${usuario.usuario}`
  });
}
