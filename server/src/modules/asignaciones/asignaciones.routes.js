import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import { resolverVigencia } from '../../middlewares/vigenciaActiva.js';
import { ROLES } from '../../shared/roles.js';
import * as schemas from './asignaciones.schemas.js';
import * as controller from './asignaciones.controller.js';

export const asignacionesRouter = Router();

asignacionesRouter.use(autenticar);

asignacionesRouter.get(
  '/',
  autorizar(ROLES.DOCENTE),
  validar({ query: schemas.consultaAsignaciones }),
  resolverVigencia,
  controller.listar
);

asignacionesRouter.get('/docentes', autorizar(ROLES.COORDINADOR), controller.docentes);

asignacionesRouter.post(
  '/',
  autorizar(ROLES.COORDINADOR),
  validar({ body: schemas.crearAsignacion, query: schemas.consultaAsignaciones }),
  resolverVigencia,
  controller.asignar
);

asignacionesRouter.delete(
  '/:cursoId/:docenteId',
  autorizar(ROLES.COORDINADOR),
  validar({ params: schemas.idsAsignacion, query: schemas.consultaAsignaciones }),
  resolverVigencia,
  controller.retirar
);
