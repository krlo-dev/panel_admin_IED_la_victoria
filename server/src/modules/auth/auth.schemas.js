import { z } from 'zod';

export const credenciales = z.object({
  usuario: z.string().trim().min(3).max(120),
  contrasena: z.string().min(1).max(255)
});

export const cambioContrasena = z.object({
  actual: z.string().min(1).max(255),
  nueva: z.string().min(8).max(64)
});
