import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { autenticar } from '../../middlewares/autenticar.js';
import { validar } from '../../middlewares/validar.js';
import * as schemas from './auth.schemas.js';
import * as controller from './auth.controller.js';

const limitarIntentos = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      codigo: 'DEMASIADOS_INTENTOS',
      mensaje: 'Demasiados intentos de inicio de sesión. Por favor espere unos minutos.'
    }
  }
});

export const authRouter = Router();

authRouter.post('/login', limitarIntentos, validar({ body: schemas.credenciales }), controller.iniciarSesion);
authRouter.get('/perfil', autenticar, controller.perfil);
authRouter.post(
  '/contrasena',
  autenticar,
  validar({ body: schemas.cambioContrasena }),
  controller.cambiarContrasena
);
authRouter.post('/cerrar-sesion', autenticar, controller.cerrarSesion);
