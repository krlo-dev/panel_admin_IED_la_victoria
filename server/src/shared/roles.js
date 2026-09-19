export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  COORDINADOR: 'Coordinador',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante'
};

export const ID_ROLES = {
  ADMINISTRADOR: 4,
  COORDINADOR: 1,
  DOCENTE: 2,
  ESTUDIANTE: 3
};

// El Administrador es un rol independiente (configuracion general, usuarios
// y catalogos institucionales); no hereda ni es heredado por Coordinador.
// El Coordinador si conserva todos los permisos de Docente (RN03).
const HERENCIA = {
  [ROLES.ADMINISTRADOR]: [ROLES.ADMINISTRADOR],
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
