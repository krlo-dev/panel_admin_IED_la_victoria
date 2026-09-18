import { z } from 'zod';

export const consultaCursos = z.object({
  busqueda: z.string().trim().max(40).optional(),
  anio: z.coerce.number().int().min(2000).max(2100).optional()
});

export const idCurso = z.object({
  id: z.coerce.number().int().positive()
});
