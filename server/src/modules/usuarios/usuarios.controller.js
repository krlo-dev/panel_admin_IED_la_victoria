import { asyncHandler } from '../../shared/asyncHandler.js';
import { creado, ok } from '../../shared/respuesta.js';
import * as service from './usuarios.service.js';

export const listar = asyncHandler(async (req, res) => {
  const { pagina, limite, busqueda, rol, activo, curso } = req.validated.query;

  const { registros, total } = await service.listar({
    busqueda,
    rol,
    activo: activo === undefined ? undefined : activo === 'true',
    curso,
    vigenciaId: req.vigencia.id,
    pagina,
    limite
  });

  ok(res, registros, { pagina, limite, total, anio: req.vigencia.anio });
});

export const obtener = asyncHandler(async (req, res) => {
  ok(res, await service.obtener(req.params.id));
});

export const crear = asyncHandler(async (req, res) => {
  creado(res, await service.crear({ datos: req.body, vigenciaId: req.vigencia.id, responsable: req.usuario }));
});

export const crearLote = asyncHandler(async (req, res) => {
  const { cursoId, estudiantes } = req.body;
  creado(
    res,
    await service.crearLote({
      cursoId,
      estudiantes,
      vigenciaId: req.vigencia.id,
      responsable: req.usuario
    })
  );
});

export const actualizar = asyncHandler(async (req, res) => {
  ok(res, await service.actualizar({ id: req.params.id, datos: req.body, responsable: req.usuario }));
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  ok(res, await service.cambiarEstado({ id: req.params.id, activo: req.body.activo, responsable: req.usuario }));
});

export const restablecerContrasena = asyncHandler(async (req, res) => {
  await service.restablecerContrasena({ id: req.params.id, responsable: req.usuario });
  ok(res, { mensaje: 'Contrasena restablecida a la identificacion del usuario' });
});
