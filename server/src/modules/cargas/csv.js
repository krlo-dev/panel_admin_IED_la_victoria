export function separarFilas(contenido) {
  return contenido
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((linea) => linea.trim().length > 0);
}

export function separarColumnas(linea) {
  const columnas = [];
  let actual = '';
  let entreComillas = false;

  for (let i = 0; i < linea.length; i += 1) {
    const caracter = linea[i];

    if (caracter === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i += 1;
      } else {
        entreComillas = !entreComillas;
      }
      continue;
    }

    if (caracter === ',' && !entreComillas) {
      columnas.push(actual.trim());
      actual = '';
      continue;
    }

    actual += caracter;
  }

  columnas.push(actual.trim());
  return columnas;
}

export function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}
