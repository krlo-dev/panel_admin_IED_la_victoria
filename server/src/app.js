import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env, isProduction } from './config/env.js';
import { rutas } from './routes/index.js';
import { noEncontrado } from './middlewares/noEncontrado.js';
import { manejadorErrores } from './middlewares/manejadorErrores.js';

export function crearApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(morgan(isProduction ? 'combined' : 'dev'));

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      // La SPA dispara varias peticiones en paralelo por cada cambio de pantalla
      // o de vigencia (listados, conteos, selector de vigencias, etc.), asi que
      // el limite por minuto tiene que ser generoso para uso normal, no solo
      // para trafico automatizado.
      limit: 600,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: {
          codigo: 'DEMASIADAS_SOLICITUDES',
          mensaje: 'Demasiadas solicitudes en poco tiempo. Espere un momento y vuelva a intentar.'
        }
      }
    })
  );

  app.use('/api', rutas);

  app.use(noEncontrado);
  app.use(manejadorErrores);

  return app;
}
