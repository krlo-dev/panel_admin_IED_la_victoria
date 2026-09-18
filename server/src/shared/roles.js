export const ROLES = {
  ADMIN: 'admin',
  COORDINADOR: 'Coordinador',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante'
};

export const ID_ROLES = {
  ADMIN: 4,
  COORDINADOR: 1,
  DOCENTE: 2,
  ESTUDIANTE: 3
};

const HERENCIA = {
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.COORDINADOR, ROLES.DOCENTE],
  [ROLES.COORDINADOR]: [ROLES.COORDINADOR, ROLES.DOCENTE],
  [ROLES.DOCENTE]: [ROLES.DOCENTE],
  [ROLES.ESTUDIANTE]: [ROLES.ESTUDIANTE]
};

export function rolesEfectivos(rol) {
  return HERENCIA[rol] ?? [];
}

export function tieneRol(rol, permitidos) {
  const efectivos = rolesEfectivos(rol);
  return permitidos.some((permitido) => efectivos.includes(permitido));
}
