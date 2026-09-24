import { pool, query, queryOne } from '../../config/db.js';

export const CLAVE_ACTIVA = 'vigencia_activa';

export async function listar() {
  return query('SELECT id, fecha_inicio AS fechaInicio, fecha_fin AS fechaFin FROM vigencia ORDER BY id DESC');
}

export async function buscarPorId(id) {
  return queryOne('SELECT id FROM vigencia WHERE id = ? LIMIT 1', [id]);
}

export async function crear({ anio, fechaInicio, fechaFin }, connection) {
  const ejecutor = connection ?? pool;
  await ejecutor.execute('INSERT INTO vigencia (id, fecha_inicio, fecha_fin) VALUES (?, ?, ?)', [
    anio,
    fechaInicio,
    fechaFin
  ]);
}

export async function activar(id, connection) {
  const ejecutor = connection ?? pool;
  const [resultado] = await ejecutor.execute('UPDATE configuracion SET valor = ? WHERE clave = ?', [
    String(id),
    CLAVE_ACTIVA
  ]);
  return resultado.affectedRows;
}

// La vigencia solo se puede borrar si nadie (ni estudiante ni docente) quedo
// matriculado en ella, en ningun curso: usuario_curso_vigencia.id_vigencia
// tiene una llave foranea hacia vigencia sin cascada (ver database/script.sql),
// asi que intentar borrar una vigencia con matriculas fallaria en la base de
// todas formas. Se valida antes para poder devolver un mensaje claro en vez
// de un error de MySQL.
export async function tieneMatriculas(id) {
  const fila = await queryOne(
    'SELECT 1 AS coincide FROM usuario_curso_vigencia WHERE id_vigencia = ? LIMIT 1',
    [id]
  );
  return Boolean(fila);
}

export async function eliminar(id, connection) {
  const ejecutor = connection ?? pool;
  await ejecutor.execute('DELETE FROM vigencia WHERE id = ?', [id]);
}
