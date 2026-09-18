import { api } from './cliente.js';

export const login = (usuario, contrasena) => api.post('/auth/login', { usuario, contrasena });
export const perfil = () => api.get('/auth/perfil');
export const cerrarSesion = () => api.post('/auth/cerrar-sesion');
export const cambiarContrasena = (actual, nueva) => api.post('/auth/contrasena', { actual, nueva });
