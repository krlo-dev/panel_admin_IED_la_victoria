export const ROLES = {
  COORDINADOR: 'Coordinador',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante'
};

const HERENCIA = {
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
