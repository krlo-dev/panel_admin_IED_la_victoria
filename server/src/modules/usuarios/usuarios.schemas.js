import { z } from 'zod';
import { ROLES } from '../../shared/roles.js';

export const crearUsuario = z
  .object({
    identificacion: z.string().trim().regex(/^\d{6,20}$/, 'La identificacion debe tener entre 6 y 20 digitos'),
    nombre: z.string().trim().min(2).max(60),
    apellido: z.string().trim().min(2).max(60),
    email: z.string().trim().email().max(120),
    rol: z.nativeEnum(ROLES),
    cursoId: z.coerce.number().int().positive().optional()
  })
  .superRefine((datos, ctx) => {
    // Un estudiante solo aparece en el directorio si queda enlazado a un curso
    // en la vigencia actual (usuario_curso_vigencia), asi que el curso es
    // obligatorio para ese rol y no se pide para los demas.
    if (datos.rol === ROLES.ESTUDIANTE && !datos.cursoId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cursoId'],
        message: 'Seleccione el curso en el que queda matriculado el estudiante'
      });
    }
  });

export const crearUsuariosLote = z.object({
  cursoId: z.coerce.number().int().positive(),
  estudiantes: z
    .array(
      z.object({
        identificacion: z.string().trim().regex(/^\d{6,20}$/, 'La identificacion debe tener entre 6 y 20 digitos'),
        nombre: z.string().trim().min(2).max(60),
        apellido: z.string().trim().min(2).max(60),
        email: z.string().trim().email().max(120)
      })
    )
    .min(1, 'Agregue al menos un estudiante antes de guardar')
    .max(100, 'Puede cargar hasta 100 estudiantes por lote')
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

export const consultaAnio = z.object({
  anio: z.coerce.number().int().min(2000).max(2100).optional()
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
