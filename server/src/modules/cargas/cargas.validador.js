import { ENCABEZADO } from './plantilla.js';
import { normalizar, separarColumnas, separarFilas } from './csv.js';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const IDENTIFICACION = /^\d{6,20}$/;

function validarEncabezado(linea) {
  const recibido = separarColumnas(linea).map(normalizar);
  const esperado = ENCABEZADO.map(normalizar);

  if (recibido.length !== esperado.length) {
    return `El archivo debe tener ${esperado.length} columnas`;
  }

  const diferencia = esperado.findIndex((columna, indice) => columna !== recibido[indice]);
  if (diferencia >= 0) {
    return `La columna ${diferencia + 1} debe llamarse ${ENCABEZADO[diferencia]}`;
  }

  return null;
}

function validarFila(columnas, anioVigencia) {
  const mensajes = [];
  const [anio, idCurso, usuario, identificacion, apellidos, nombres, email] = columnas;

  if (Number(anio) !== anioVigencia) {
    mensajes.push(`El año debe ser ${anioVigencia}`);
  }
  if (!/^\d+$/.test(idCurso ?? '')) {
    mensajes.push('El idCurso debe ser numerico');
  }
  if (!usuario || usuario.length < 4 || usuario.length > 20) {
    mensajes.push('El usuario debe tener entre 4 y 20 caracteres');
  }
  if (!IDENTIFICACION.test(identificacion ?? '')) {
    mensajes.push('La identificación debe tener entre 6 y 20 dígitos');
  }
  if (!apellidos) {
    mensajes.push('Los apellidos son obligatorios');
  }
  if (!nombres) {
    mensajes.push('Los nombres son obligatorios');
  }
  if (!CORREO.test(email ?? '')) {
    mensajes.push('El correo no tiene un formato válido');
  }

  return mensajes;
}

export function validarFormato({ contenido, anioVigencia }) {
  const lineas = separarFilas(contenido);

  if (lineas.length === 0) {
    return { filas: [], errores: [{ fila: 0, mensajes: ['El archivo está vacío'] }] };
  }

  const errorEncabezado = validarEncabezado(lineas[0]);
  if (errorEncabezado) {
    return { filas: [], errores: [{ fila: 1, mensajes: [errorEncabezado] }] };
  }

  if (lineas.length === 1) {
    return { filas: [], errores: [{ fila: 1, mensajes: ['El archivo no tiene filas de datos'] }] };
  }

  const filas = [];
  const errores = [];
  const identificaciones = new Set();
  const usuarios = new Set();
  const correos = new Set();

  lineas.slice(1).forEach((linea, indice) => {
    const numeroFila = indice + 2;
    const columnas = separarColumnas(linea);

    if (columnas.length !== ENCABEZADO.length) {
      errores.push({ fila: numeroFila, mensajes: [`La fila debe tener ${ENCABEZADO.length} columnas`] });
      return;
    }

    const mensajes = validarFila(columnas, anioVigencia);
    const [, idCurso, usuario, identificacion, apellidos, nombres, email] = columnas;

    if (identificaciones.has(identificacion)) {
      mensajes.push('La identificación está repetida en el archivo');
    }
    if (usuarios.has(usuario)) {
      mensajes.push('El usuario está repetido en el archivo');
    }
    if (correos.has(email)) {
      mensajes.push('El correo está repetido en el archivo');
    }

    if (mensajes.length) {
      errores.push({ fila: numeroFila, mensajes });
      return;
    }

    identificaciones.add(identificacion);
    usuarios.add(usuario);
    correos.add(email);
    filas.push({
      fila: numeroFila,
      idCurso: Number(idCurso),
      usuario,
      identificacion,
      apellido: apellidos,
      nombre: nombres,
      email
    });
  });

  return { filas, errores };
}
