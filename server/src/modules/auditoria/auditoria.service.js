import * as repository from './auditoria.repository.js';

export async function registrar({ responsable, accion, entidad, entidadId, detalle }, connection) {
  return repository.crear(
    {
      accion,
      entidad,
      entidadId: entidadId != null ? String(entidadId) : null,
      detalle: detalle ? String(detalle).slice(0, 255) : accion,
      usuarioId: responsable.id
    },
    connection
  );
}

export async function listar({ entidad, accion, desde, hasta, limite, pagina }) {
  return repository.listar({ entidad, accion, desde, hasta, limite, pagina });
}
