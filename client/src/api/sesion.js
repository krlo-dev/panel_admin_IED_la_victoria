const CLAVE = 'panel_admin_token';

let enMemoria = null;

export function guardarToken(token) {
  enMemoria = token;
  try {
    sessionStorage.setItem(CLAVE, token);
  } catch {
    enMemoria = token;
  }
}

export function obtenerToken() {
  if (enMemoria) {
    return enMemoria;
  }

  try {
    enMemoria = sessionStorage.getItem(CLAVE);
  } catch {
    enMemoria = null;
  }

  return enMemoria;
}

export function borrarToken() {
  enMemoria = null;
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    enMemoria = null;
  }
}
