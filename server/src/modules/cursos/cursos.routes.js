import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import { resolverVigencia } from '../../middlewares/vigenciaActiva.js';
import { ROLES } from '../../shared/roles.js';
import * as schemas from './cursos.schemas.js';
import * as controller from './cursos.controller.js';

export const cursosRouter = Router();

cursosRouter.use(autenticar, autorizar(ROLES.DOCENTE));

cursosRouter.get('/', validar({ query: schemas.consultaCursos }), resolverVigencia, controller.listar);
cursosRouter.get('/mios', validar({ query: schemas.consultaCursos }), resolverVigencia, controller.mios);
cursosRouter.get(
  '/:id',
  validar({ params: schemas.idCurso, query: schemas.consultaCursos }),
  resolverVigencia,
  controller.obtener
);
