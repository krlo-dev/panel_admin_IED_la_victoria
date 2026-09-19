import { z } from 'zod';

export const consultaCursos = z.object({
  busqueda: z.string().trim().max(40).optional(),
  anio: z.coerce.number().int().min(2000).max(2100).optional()
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
