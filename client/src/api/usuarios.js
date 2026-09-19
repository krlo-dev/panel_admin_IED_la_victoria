import { api } from './cliente.js';

export const listarUsuarios = (filtros) => api.get('/usuarios', filtros);
export const obtenerUsuario = (id) => api.get(`/usuarios/${id}`);
export const crearUsuario = (datos, anio) => api.post('/usuarios', datos, { anio });
export const crearUsuariosLote = (datos, anio) => api.post('/usuarios/lote', datos, { anio });
export const actualizarUsuario = (id, datos) => api.patch(`/usuarios/${id}`, datos);
export const cambiarEstadoUsuario = (id, activo) => api.patch(`/usuarios/${id}/estado`, { activo });
export const restablecerContrasena = (id) => api.post(`/usuarios/${id}/contrasena`);
