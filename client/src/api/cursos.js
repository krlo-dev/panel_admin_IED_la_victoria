import { api } from './cliente.js';

export const listarCursos = (filtros) => api.get('/cursos', filtros);
export const misCursos = (filtros) => api.get('/cursos/mios', filtros);
export const obtenerCurso = (id, filtros) => api.get(`/cursos/${id}`, filtros);
