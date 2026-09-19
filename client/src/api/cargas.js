import { api, BASE, MODO_DEMO } from './cliente.js';
import { obtenerToken } from './sesion.js';

export function enviarCargaMasiva(archivo, anio) {
  const formulario = new FormData();
  formulario.append('archivo', archivo);
  return api.subir('/cargas/usuarios', formulario, { anio });
}

function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export async function descargarPlantilla() {
  if (MODO_DEMO) {
    const { generarPlantillaCsv } = await import('./mocks/servidor.js');
    descargarBlob(generarPlantillaCsv(), 'plantilla_carga_masiva.csv');
    return;
  }

  const token = obtenerToken();
  const respuesta = await fetch(`${BASE}/cargas/plantilla`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!respuesta.ok) {
    throw new Error('No fue posible descargar la plantilla');
  }

  descargarBlob(await respuesta.blob(), 'plantilla_carga_masiva.csv');
}

export async function descargarPlantillaEjemplo(anio) {
  if (MODO_DEMO) {
    const { generarPlantillaEjemploCsv } = await import('./mocks/servidor.js');
    descargarBlob(generarPlantillaEjemploCsv(anio), 'plantilla_ejemplo_carga_masiva.csv');
    return;
  }

  const token = obtenerToken();
  const url = new URL(`${BASE}/cargas/plantilla-ejemplo`);
  if (anio) {
    url.searchParams.set('anio', String(anio));
  }

  const respuesta = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!respuesta.ok) {
    throw new Error('No fue posible descargar la plantilla de ejemplo');
  }

  descargarBlob(await respuesta.blob(), 'plantilla_ejemplo_carga_masiva.csv');
}
