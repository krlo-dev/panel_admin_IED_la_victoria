export const ENCABEZADO = ['Año', 'idCurso', 'Usuario', 'Identificación', 'Apellidos', 'Nombres', 'E-Mail'];

export const ENCABEZADO_CSV = `${ENCABEZADO.join(',')}\n`;

// Fila de ejemplo para que quien llena el archivo vea el formato esperado con
// datos reales y no solo los nombres de columna. El idCurso es solo
// ilustrativo (aqui se usa 111 a modo de ejemplo), debe reemplazarse por un
// curso que exista de verdad, visible en la pantalla de Cursos.
export function filaEjemplo(anio) {
  const anioMostrado = anio ?? new Date().getFullYear();
  return [
    anioMostrado,
    111,
    'juan.perez',
    1000000001,
    'Perez Gomez',
    'Juan Camilo',
    'juan.perez@iedlavictoria.edu.co'
  ].join(',');
}

export function plantillaEjemploCsv(anio) {
  return `${ENCABEZADO_CSV}${filaEjemplo(anio)}\n`;
}
