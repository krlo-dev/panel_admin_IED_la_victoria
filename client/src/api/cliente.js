import { obtenerToken } from './sesion.js';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function solicitar(ruta, { metodo = 'GET', cuerpo, formulario, query } = {}) {
  const url = new URL(`${BASE}${ruta}`);

  if (query) {
    Object.entries(query)
      .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
      .forEach(([clave, valor]) => url.searchParams.set(clave, String(valor)));
  }

  const cabeceras = {};
  const token = obtenerToken();
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`;
  }
  if (cuerpo) {
    cabeceras['Content-Type'] = 'application/json';
  }

  const respuesta = await fetch(url, {
    method: metodo,
    headers: cabeceras,
    body: formulario ?? (cuerpo ? JSON.stringify(cuerpo) : undefined)
  });

  if (respuesta.status === 204) {
    return null;
  }

  const contenido = respuesta.headers.get('content-type') ?? '';
  const datos = contenido.includes('application/json') ? await respuesta.json() : await respuesta.text();

  if (!respuesta.ok) {
    const error = new Error(datos?.error?.mensaje ?? 'No fue posible completar la operacion');
    error.codigo = datos?.error?.codigo;
    error.detalles = datos?.error?.detalles;
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

export const api = {
  get: (ruta, query) => solicitar(ruta, { query }),
  post: (ruta, cuerpo, query) => solicitar(ruta, { metodo: 'POST', cuerpo, query }),
  patch: (ruta, cuerpo) => solicitar(ruta, { metodo: 'PATCH', cuerpo }),
  eliminar: (ruta, query) => solicitar(ruta, { metodo: 'DELETE', query }),
  subir: (ruta, formulario, query) => solicitar(ruta, { metodo: 'POST', formulario, query })
};
