import { api } from './cliente.js';

export const listarCursos = (filtros) => api.get('/cursos', filtros);
export const crearCurso = (datos) => api.post('/cursos', datos);
export const eliminarCurso = (id) => api.eliminar(`/cursos/${id}`);
export const misCursos = (filtros) => api.get('/cursos/mios', filtros);
export const obtenerCurso = (id, filtros) => api.get(`/cursos/${id}`, filtros);
