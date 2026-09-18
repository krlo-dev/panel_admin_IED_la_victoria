import { z } from 'zod';
import { ROLES } from '../../shared/roles.js';

export const crearUsuario = z.object({
  identificacion: z.string().trim().regex(/^\d{6,20}$/, 'La identificacion debe tener entre 6 y 20 digitos'),
  usuario: z.string().trim().min(4).max(20),
  nombre: z.string().trim().min(2).max(60),
  apellido: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(120),
  rol: z.nativeEnum(ROLES)
});

export const actualizarUsuario = z.object({
  nombre: z.string().trim().min(2).max(60).optional(),
  apellido: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().email().max(120).optional(),
  rol: z.nativeEnum(ROLES).optional()
});

export const cambiarEstado = z.object({
  activo: z.boolean()
});

export const idUsuario = z.object({
  id: z.coerce.number().int().positive()
});

export const consultaUsuarios = z.object({
  busqueda: z.string().trim().max(80).optional(),
  rol: z.nativeEnum(ROLES).optional(),
  activo: z.enum(['true', 'false']).optional(),
  curso: z.coerce.number().int().positive().optional(),
  anio: z.coerce.number().int().min(2000).max(2100).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20)
});
