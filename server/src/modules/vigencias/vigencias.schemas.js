import { z } from 'zod';

export const crearVigencia = z.object({
  anio: z.coerce.number().int().min(2000).max(2100),
  fechaInicio: z.string().date(),
  fechaFin: z.string().date()
});

export const idVigencia = z.object({
  id: z.coerce.number().int().positive()
});
