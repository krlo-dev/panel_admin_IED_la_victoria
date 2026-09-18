import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import { ROLES } from '../../shared/roles.js';
import { consultaAuditoria } from './auditoria.schemas.js';
import * as controller from './auditoria.controller.js';

export const auditoriaRouter = Router();

auditoriaRouter.use(autenticar, autorizar(ROLES.COORDINADOR));

auditoriaRouter.get('/', validar({ query: consultaAuditoria }), controller.listar);
