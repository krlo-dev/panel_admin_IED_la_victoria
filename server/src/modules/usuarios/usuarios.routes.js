import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import { resolverVigencia } from '../../middlewares/vigenciaActiva.js';
import { ROLES } from '../../shared/roles.js';
import * as schemas from './usuarios.schemas.js';
import * as controller from './usuarios.controller.js';

export const usuariosRouter = Router();

usuariosRouter.use(autenticar, autorizar(ROLES.COORDINADOR));

usuariosRouter.get(
  '/',
  validar({ query: schemas.consultaUsuarios }),
  resolverVigencia,
  controller.listar
);

usuariosRouter.get('/:id', validar({ params: schemas.idUsuario }), controller.obtener);
usuariosRouter.post('/', validar({ body: schemas.crearUsuario }), controller.crear);
usuariosRouter.patch(
  '/:id',
  validar({ params: schemas.idUsuario, body: schemas.actualizarUsuario }),
  controller.actualizar
);
usuariosRouter.patch(
  '/:id/estado',
  validar({ params: schemas.idUsuario, body: schemas.cambiarEstado }),
  controller.cambiarEstado
);
usuariosRouter.post(
  '/:id/contrasena',
  validar({ params: schemas.idUsuario }),
  controller.restablecerContrasena
);
