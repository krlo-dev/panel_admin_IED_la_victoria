import { api } from './cliente.js';

export function enviarCargaMasiva(archivo, anio) {
  const formulario = new FormData();
  formulario.append('archivo', archivo);
  return api.subir('/cargas/usuarios', formulario, { anio });
}
