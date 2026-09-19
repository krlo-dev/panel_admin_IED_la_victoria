import { Router } from 'express';
import { autenticar } from '../../middlewares/autenticar.js';
import { autorizar } from '../../middlewares/autorizar.js';
import { validar } from '../../middlewares/validar.js';
import { resolverVigencia } from '../../middlewares/vigenciaActiva.js';
import { ROLES } from '../../shared/roles.js';
import * as schemas from './cursos.schemas.js';
import * as controller from './cursos.controller.js';

export const cursosRouter = Router();

cursosRouter.use(autenticar);

// El listado tambien lo usa Administrador (solo lectura) para elegir el curso
// al matricular un estudiante nuevo desde "Crear nuevo usuario"; el resto de
// las rutas de este modulo siguen siendo exclusivas de Docente y Coordinador.
cursosRouter.get(
  '/',
  autorizar(ROLES.DOCENTE, ROLES.ADMINISTRADOR),
  validar({ query: schemas.consultaCursos }),
  resolverVigencia,
  controller.listar
);

// Crear cursos es "gestionar catalogos institucionales", que en la tabla de
// actores le corresponde a Administrador, no a Coordinador. No depende de la
// vigencia: el curso queda disponible para todas las vigencias (RN05).
cursosRouter.post(
  '/',
  autorizar(ROLES.ADMINISTRADOR),
  validar({ body: schemas.crearCurso }),
  controller.crear
);

// Eliminar tambien es "gestionar catalogos institucionales", exclusivo de
// Administrador, y solo procede si el curso nunca tuvo matriculas (lo valida
// el servicio contra usuario_curso_vigencia en cualquier vigencia).
cursosRouter.delete(
  '/:id',
  autorizar(ROLES.ADMINISTRADOR),
  validar({ params: schemas.idCurso }),
  controller.eliminar
);

cursosRouter.get(
  '/mios',
  autorizar(ROLES.DOCENTE),
  validar({ query: schemas.consultaCursos }),
  resolverVigencia,
  controller.mios
);
cursosRouter.get(
  '/:id',
  autorizar(ROLES.DOCENTE, ROLES.ADMINISTRADOR),
  validar({ params: schemas.idCurso, query: schemas.consultaCursos }),
  resolverVigencia,
  controller.obtener
);
