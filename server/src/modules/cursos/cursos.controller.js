import { asyncHandler } from '../../shared/asyncHandler.js';
import { creado, ok, sinContenido } from '../../shared/respuesta.js';
import * as service from './cursos.service.js';

export const listar = asyncHandler(async (req, res) => {
  const { busqueda, soloConEstudiantes } = req.validated.query;
  const cursos = await service.listar({
    vigenciaId: req.vigencia.id,
    busqueda,
    usuario: req.usuario,
    soloConEstudiantes: soloConEstudiantes === 'true'
  });
  ok(res, cursos, { anio: req.vigencia.anio, total: cursos.length });
});

export const crear = asyncHandler(async (req, res) => {
  const { grado, seccion } = req.body;
  creado(res, await service.crear({ grado, seccion, responsable: req.usuario }));
});

export const mios = asyncHandler(async (req, res) => {
  ok(res, await service.mios({ usuario: req.usuario, vigenciaId: req.vigencia.id }), {
    anio: req.vigencia.anio
  });
});

export const eliminar = asyncHandler(async (req, res) => {
  await service.eliminar({ id: req.params.id, responsable: req.usuario });
  sinContenido(res);
});

export const obtener = asyncHandler(async (req, res) => {
  ok(res, await service.obtener({ id: req.params.id, vigenciaId: req.vigencia.id, usuario: req.usuario }));
});
