import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import { ROLES } from '../../shared/roles.js';
import * as schemas from './vigencias.schemas.js';
import * as controller from './vigencias.controller.js';

export const vigenciasRouter = Router();

vigenciasRouter.use(autenticar);

// El listado lo sigue usando el selector de vigencias en Cursos/Usuarios
// (Docente, Coordinador y ahora Administrador). Crear y activar vigencias
// pasa a ser exclusivo de Administrador; el Coordinador ya no administra
// vigencias, solo las consulta.
vigenciasRouter.get('/', autorizar(ROLES.DOCENTE, ROLES.ADMINISTRADOR), controller.listar);
vigenciasRouter.post(
  '/',
  autorizar(ROLES.ADMINISTRADOR),
  validar({ body: schemas.crearVigencia }),
  controller.crear
);
vigenciasRouter.patch(
  '/:id/activar',
  autorizar(ROLES.ADMINISTRADOR),
  validar({ params: schemas.idVigencia }),
  controller.activar
);
