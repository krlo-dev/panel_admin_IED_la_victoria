import { Router } from 'express';
import multer from 'multer';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { resolverVigencia } from '../../middlewares/vigenciaActiva.js';
import { ROLES } from '../../shared/roles.js';
import { HttpError } from '../../shared/httpError.js';
import * as controller from './cargas.controller.js';

const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const permitidos = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (!permitidos.includes(file.mimetype)) {
      callback(HttpError.badRequest('El archivo debe estar en formato CSV'));
      return;
    }
    callback(null, true);
  }
});

export const cargasRouter = Router();

cargasRouter.use(autenticar, autorizar(ROLES.ADMINISTRADOR));

cargasRouter.get('/plantilla', controller.descargarPlantilla);
cargasRouter.get('/plantilla-ejemplo', controller.descargarPlantillaEjemplo);
cargasRouter.post('/usuarios', resolverVigencia, subida.single('archivo'), controller.procesar);
