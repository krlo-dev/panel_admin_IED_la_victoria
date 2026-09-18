import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { usuariosRouter } from '../modules/usuarios/usuarios.routes.js';
import { cursosRouter } from '../modules/cursos/cursos.routes.js';
import { asignacionesRouter } from '../modules/asignaciones/asignaciones.routes.js';
import { cargasRouter } from '../modules/cargas/cargas.routes.js';
import { vigenciasRouter } from '../modules/vigencias/vigencias.routes.js';
import { auditoriaRouter } from '../modules/auditoria/auditoria.routes.js';

export const rutas = Router();

rutas.get('/salud', (_req, res) => {
  res.json({ data: { estado: 'activo', hora: new Date().toISOString() } });
});

rutas.use('/auth', authRouter);
rutas.use('/usuarios', usuariosRouter);
rutas.use('/cursos', cursosRouter);
rutas.use('/asignaciones', asignacionesRouter);
rutas.use('/cargas', cargasRouter);
rutas.use('/vigencias', vigenciasRouter);
rutas.use('/auditoria', auditoriaRouter);
