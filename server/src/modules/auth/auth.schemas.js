import { z } from 'zod';

export const credenciales = z.object({
  usuario: z
    .string({ required_error: 'El usuario, correo o documento es obligatorio' })
    .trim()
    .min(3, { message: 'El identificador debe tener al menos 3 caracteres' })
    .max(120, { message: 'El identificador no puede superar los 120 caracteres' }),
  contrasena: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, { message: 'La contraseña es obligatoria' })
    .max(255, { message: 'La contraseña no puede superar los 255 caracteres' })
});

export const cambioContrasena = z.object({
  actual: z
    .string({ required_error: 'La contraseña actual es obligatoria' })
    .min(1, { message: 'La contraseña actual es obligatoria' })
    .max(255, { message: 'La contraseña actual no puede superar los 255 caracteres' }),
  nueva: z
    .string({ required_error: 'La nueva contraseña es obligatoria' })
    .min(5, { message: 'La nueva contraseña debe tener al menos 5 caracteres' })
    .max(64, { message: 'La nueva contraseña no puede superar los 64 caracteres' })
});
