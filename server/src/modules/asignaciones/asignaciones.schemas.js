import { z } from 'zod';

export const crearAsignacion = z.object({
  cursoId: z.coerce.number().int().positive(),
  docenteId: z.coerce.number().int().positive()
});

export const idsAsignacion = z.object({
  cursoId: z.coerce.number().int().positive(),
  docenteId: z.coerce.number().int().positive()
});

export const consultaAsignaciones = z.object({
  curso: z.coerce.number().int().positive().optional(),
  anio: z.coerce.number().int().min(2000).max(2100).optional()
});
