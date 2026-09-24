import { api } from './cliente.js';

export const listarVigencias = () => api.get('/vigencias');
export const crearVigencia = (datos) => api.post('/vigencias', datos);
export const activarVigencia = (id) => api.patch(`/vigencias/${id}/activar`);
export const eliminarVigencia = (id) => api.eliminar(`/vigencias/${id}`);
