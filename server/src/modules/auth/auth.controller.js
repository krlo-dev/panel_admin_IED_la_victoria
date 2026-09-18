import { asyncHandler } from '../../shared/asyncHandler.js';
import { ok } from '../../shared/respuesta.js';
import { rolesEfectivos } from '../../shared/roles.js';
import * as service from './auth.service.js';

export const iniciarSesion = asyncHandler(async (req, res) => {
  const { token, usuario } = await service.iniciarSesion(req.body);
  ok(res, { token, usuario, rolesEfectivos: rolesEfectivos(usuario.rol) });
});

export const perfil = asyncHandler(async (req, res) => {
  const datos = await service.perfil(req.usuario);
  ok(res, { ...datos, rolesEfectivos: rolesEfectivos(req.usuario.rol) });
});

export const cambiarContrasena = asyncHandler(async (req, res) => {
  await service.cambiarContrasena({
    usuario: req.usuario,
    actual: req.body.actual,
    nueva: req.body.nueva
  });
  ok(res, { mensaje: 'Contrasena actualizada' });
});

export const cerrarSesion = asyncHandler(async (req, res) => {
  await service.cerrarSesion(req.usuario);
  ok(res, { mensaje: 'Sesion cerrada' });
});
