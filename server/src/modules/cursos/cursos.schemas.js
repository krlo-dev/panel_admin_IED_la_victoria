import { z } from 'zod';

export const consultaCursos = z.object({
  busqueda: z.string().trim().max(40).optional(),
  anio: z.coerce.number().int().min(2000).max(2100).optional(),
  // Solo lo usa la vista de listado (Cursos.jsx): oculta los cursos sin
  // estudiantes matriculados en la vigencia consultada. El resto de
  // consumidores de GET /cursos (crear usuario, carga masiva) necesitan el
  // catalogo completo para poder matricular al primer estudiante, asi que
  // no lo mandan y siguen viendo todos los cursos.
  soloConEstudiantes: z.enum(['true', 'false']).optional()
});

export const idCurso = z.object({
  id: z.coerce.number().int().positive()
});

// El id no se escribe a mano: se calcula a partir del grado y la seccion,
// siguiendo el mismo patron que ya trae el script del profesor
// (grado*100 + 11 para la seccion A, +12 para B, +13 para C, etc.).
export const crearCurso = z.object({
  grado: z.coerce.number().int().min(1).max(11),
  seccion: z.enum(['A', 'B', 'C', 'D', 'E', 'F'])
});
