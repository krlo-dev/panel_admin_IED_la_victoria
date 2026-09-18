import { z } from 'zod';

export const consultaAuditoria = z.object({
  entidad: z.string().trim().max(40).optional(),
  accion: z.string().trim().max(40).optional(),
  desde: z.string().trim().max(25).optional(),
  hasta: z.string().trim().max(25).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20)
});
