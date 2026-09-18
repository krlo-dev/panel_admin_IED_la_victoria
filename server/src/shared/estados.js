export const ESTADOS = {
  ACTIVO: 1,
  BLOQUEADO: 2
};

export function nombreEstado(id) {
  return id === ESTADOS.ACTIVO ? 'Activo' : 'Bloqueado';
}
