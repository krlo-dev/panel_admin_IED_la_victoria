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
      limit: 120,
      skip: () => process.env.NODE_ENV !== 'production',
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use('/api', rutas);

  app.use(noEncontrado);
  app.use(manejadorErrores);

  return app;
}
