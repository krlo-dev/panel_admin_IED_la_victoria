import { pool, query } from '../../config/db.js';
import { siguienteId } from '../../shared/ids.js';

export async function crear({ accion, entidad, entidadId, detalle, usuarioId }, connection) {
  const ejecutor = connection ?? pool;
  const id = await siguienteId(ejecutor, 'G3_logs');

  await ejecutor.execute(
    `INSERT INTO G3_logs (id, accion, entidad, id_entidad, mistake, id_usuario)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, accion, entidad, entidadId, detalle, usuarioId]
  );

  return id;
}

export async function listar({ entidad, accion, desde, hasta, limite, pagina }) {
  const condiciones = [];
  const parametros = [];

  if (entidad) {
    condiciones.push('l.entidad = ?');
    parametros.push(entidad);
  }
  if (accion) {
    condiciones.push('l.accion = ?');
    parametros.push(accion);
  }
  if (desde) {
    condiciones.push('l.fecha >= ?');
    parametros.push(desde);
  }
  if (hasta) {
    condiciones.push('l.fecha <= ?');
    parametros.push(hasta);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const offset = (pagina - 1) * limite;

  const registros = await query(
    `SELECT l.id,
            l.accion,
            l.entidad,
            l.id_entidad AS idEntidad,
            l.mistake AS detalle,
            l.fecha,
            u.usuario AS responsable
       FROM G3_logs l
       JOIN usuario u ON u.id = l.id_usuario
       ${where}
      ORDER BY l.fecha DESC, l.id DESC
      LIMIT ? OFFSET ?`,
    [...parametros, limite, offset]
  );

  const [{ total }] = await query(`SELECT COUNT(*) AS total FROM G3_logs l ${where}`, parametros);

  return { registros, total: Number(total) };
}
