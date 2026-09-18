import { api } from './cliente.js';

export const listarAuditoria = (filtros) => api.get('/auditoria', filtros);
