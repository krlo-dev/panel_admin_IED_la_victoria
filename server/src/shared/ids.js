const TABLAS = new Set(['usuario', 'curso', 'vigencia', 'logs', 'configuracion', 'rol', 'estado']);

export async function siguienteId(ejecutor, tabla) {
  if (!TABLAS.has(tabla)) {
    throw new Error(`Tabla no permitida para generar id: ${tabla}`);
  }

  const [filas] = await ejecutor.execute(`SELECT COALESCE(MAX(id), 0) + 1 AS siguiente FROM \`${tabla}\``);
  return Number(filas[0].siguiente);
}
