import { api } from './cliente.js';

export const listarDocentesDisponibles = () => api.get('/asignaciones/docentes');
export const asignarDocente = (datos, anio) => api.post('/asignaciones', datos, { anio });
export const retirarDocente = (cursoId, docenteId, anio) =>
  api.eliminar(`/asignaciones/${cursoId}/${docenteId}`, { anio });
