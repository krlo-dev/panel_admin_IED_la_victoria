import { ROLES } from '../../shared/roles.js';

export const estado = {
  usuarios: [
    {
      id: 1,
      identificacion: '10000001',
      usuario: 'coordinador',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      email: 'coordinador@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.COORDINADOR
    },
    {
      id: 11,
      identificacion: '20000001',
      usuario: 'docente1',
      nombre: 'Ana',
      apellido: 'Martinez',
      email: 'docente1@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.DOCENTE
    },
    {
      id: 12,
      identificacion: '20000002',
      usuario: 'docente2',
      nombre: 'Luis',
      apellido: 'Rodriguez',
      email: 'docente2@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.DOCENTE
    },
    {
      id: 13,
      identificacion: '20000003',
      usuario: 'docente3',
      nombre: 'Marta',
      apellido: 'Gomez',
      email: 'docente3@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.DOCENTE
    },
    {
      id: 14,
      identificacion: '20000004',
      usuario: 'docente4',
      nombre: 'Jorge',
      apellido: 'Perez',
      email: 'docente4@iedlavictoria.edu.co',
      idEstado: 2,
      estado: 'Bloqueado',
      rol: ROLES.DOCENTE
    },
    {
      id: 1001,
      identificacion: '3000000001',
      usuario: 'est001',
      nombre: 'Sofia',
      apellido: 'Cantillo',
      email: 'est001@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.ESTUDIANTE
    },
    {
      id: 1002,
      identificacion: '3000000002',
      usuario: 'est002',
      nombre: 'Mateo',
      apellido: 'Narvaez',
      email: 'est002@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.ESTUDIANTE
    },
    {
      id: 1003,
      identificacion: '3000000003',
      usuario: 'est003',
      nombre: 'Valentina',
      apellido: 'Payares',
      email: 'est003@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.ESTUDIANTE
    },
    {
      id: 1004,
      identificacion: '3000000004',
      usuario: 'est004',
      nombre: 'Julian',
      apellido: 'Polo',
      email: 'est004@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.ESTUDIANTE
    },
    {
      id: 1005,
      identificacion: '3000000005',
      usuario: 'est005',
      nombre: 'Beatriz',
      apellido: 'Lopez',
      email: 'est005@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.ESTUDIANTE
    },
    {
      id: 1006,
      identificacion: '3000000006',
      usuario: 'est006',
      nombre: 'Alvaro',
      apellido: 'Valera',
      email: 'est006@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.ESTUDIANTE
    },
    {
      id: 1007,
      identificacion: '3000000007',
      usuario: 'est007',
      nombre: 'Guillermo',
      apellido: 'Salazar',
      email: 'est007@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.ESTUDIANTE
    },
    {
      id: 1008,
      identificacion: '3000000008',
      usuario: 'est008',
      nombre: 'Mariana',
      apellido: 'Gomez',
      email: 'est008@iedlavictoria.edu.co',
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.ESTUDIANTE
    },
    {
      id: 1009,
      identificacion: '3000000009',
      usuario: 'est009',
      nombre: 'Samuel',
      apellido: 'Osorio',
      email: 'est009@iedlavictoria.edu.co',
      idEstado: 2,
      estado: 'Bloqueado',
      rol: ROLES.ESTUDIANTE
    }
  ],

  cursos: [
    { id: 111, grado: '1A' },
    { id: 112, grado: '1B' },
    { id: 811, grado: '8A' },
    { id: 812, grado: '8B' },
    { id: 1011, grado: '10A' },
    { id: 1012, grado: '10B' }
  ],

  matriculas: [
    { cursoId: 111, usuarioId: 1001 },
    { cursoId: 111, usuarioId: 1002 },
    { cursoId: 111, usuarioId: 1003 },
    { cursoId: 111, usuarioId: 11 },
    { cursoId: 112, usuarioId: 1004 },
    { cursoId: 112, usuarioId: 1005 },
    { cursoId: 112, usuarioId: 12 },
    { cursoId: 811, usuarioId: 1006 },
    { cursoId: 811, usuarioId: 1007 },
    { cursoId: 811, usuarioId: 13 },
    { cursoId: 812, usuarioId: 1008 },
    { cursoId: 812, usuarioId: 1009 },
    { cursoId: 1011, usuarioId: 1 }
  ],

  vigencias: [
    { id: 2026, fechaInicio: '2026-01-01', fechaFin: '2026-12-31' },
    { id: 2025, fechaInicio: '2025-01-01', fechaFin: '2025-11-29' },
    { id: 2024, fechaInicio: '2024-01-01', fechaFin: '2024-11-30' }
  ],
  vigenciaActivaId: 2026,

  auditoria: [
    {
      id: 8,
      accion: 'RESTABLECIMIENTO_CONTRASENA',
      entidad: 'usuario',
      idEntidad: '1009',
      detalle: 'Contrasena de est009 restablecida a la identificacion',
      fecha: '2026-09-17T14:05:00Z',
      responsable: 'coordinador'
    },
    {
      id: 7,
      accion: 'BLOQUEO',
      entidad: 'usuario',
      idEntidad: '1009',
      detalle: 'Usuario est009 bloqueado',
      fecha: '2026-09-17T13:58:00Z',
      responsable: 'coordinador'
    },
    {
      id: 6,
      accion: 'ASIGNACION_CURSO',
      entidad: 'curso',
      idEntidad: '1011',
      detalle: 'Coordinador asignado como tutor del curso 1011',
      fecha: '2026-09-16T16:20:00Z',
      responsable: 'coordinador'
    },
    {
      id: 5,
      accion: 'CARGA_MASIVA_ACEPTADA',
      entidad: 'usuario',
      idEntidad: null,
      detalle: 'Archivo matricula_2026_lote1.csv con 9 estudiantes cargados en la vigencia 2026',
      fecha: '2026-09-15T09:12:00Z',
      responsable: 'coordinador'
    },
    {
      id: 4,
      accion: 'CREACION',
      entidad: 'usuario',
      idEntidad: '14',
      detalle: 'Usuario docente4 creado con rol Docente',
      fecha: '2026-09-12T11:30:00Z',
      responsable: 'coordinador'
    },
    {
      id: 3,
      accion: 'ACTUALIZACION',
      entidad: 'usuario',
      idEntidad: '12',
      detalle: 'Usuario docente2 actualizado',
      fecha: '2026-09-10T08:45:00Z',
      responsable: 'coordinador'
    },
    {
      id: 2,
      accion: 'ACTIVACION_VIGENCIA',
      entidad: 'vigencia',
      idEntidad: '2026',
      detalle: 'Vigencia activa cambiada a 2026',
      fecha: '2026-01-02T07:00:00Z',
      responsable: 'coordinador'
    },
    {
      id: 1,
      accion: 'INICIO_SESION',
      entidad: 'usuario',
      idEntidad: '1',
      detalle: 'Ingreso del usuario coordinador',
      fecha: '2026-01-02T06:55:00Z',
      responsable: 'coordinador'
    }
  ]
};

let siguienteIdUsuario = 1010;
let siguienteIdAuditoria = 9;

export function nuevoIdUsuario() {
  siguienteIdUsuario += 1;
  return siguienteIdUsuario;
}

export function nuevoIdAuditoria() {
  siguienteIdAuditoria += 1;
  return siguienteIdAuditoria;
}

export function registrarAuditoria({ accion, entidad, idEntidad, detalle, responsable }) {
  estado.auditoria.unshift({
    id: nuevoIdAuditoria(),
    accion,
    entidad,
    idEntidad: idEntidad != null ? String(idEntidad) : null,
    detalle,
    fecha: new Date().toISOString(),
    responsable
  });
}
