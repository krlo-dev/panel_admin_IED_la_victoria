import { pool, query, queryOne } from '../../config/db.js';
import { ROLES } from '../../shared/roles.js';

export async function listar({ vigenciaId, curso }) {
  const condiciones = ['ucv.id_vigencia = ?', 'r.nombre IN (?, ?)'];
  const parametros = [vigenciaId, ROLES.DOCENTE, ROLES.COORDINADOR];

  if (curso) {
    condiciones.push('ucv.id_curso = ?');
    parametros.push(curso);
  }

  return query(
    `SELECT ucv.id_curso AS cursoId,
            c.grado,
            u.id AS docenteId,
            u.usuario,
            CONCAT_WS(' ', u.nombre, u.apellido) AS docente,
            r.nombre AS rol
       FROM usuario_curso_vigencia ucv
       JOIN curso c ON c.id = ucv.id_curso
       JOIN usuario u ON u.id = ucv.id_usuario
       JOIN rol r ON r.id = u.id_rol
      WHERE ${condiciones.join(' AND ')}
      ORDER BY c.id, u.apellido`,
    parametros
  );
}

export async function docenteValido(docenteId) {
  return queryOne(
    `SELECT u.id, u.usuario
       FROM usuario u
       JOIN rol r ON r.id = u.id_rol
      WHERE u.id = ? AND u.id_estado = 1 AND r.nombre IN (?, ?)
      LIMIT 1`,
    [docenteId, ROLES.DOCENTE, ROLES.COORDINADOR]
  );
}

export async function existe({ cursoId, docenteId, vigenciaId }) {
  const fila = await queryOne(
    `SELECT 1 AS coincide
       FROM usuario_curso_vigencia
      WHERE id_curso = ? AND id_usuario = ? AND id_vigencia = ?
      LIMIT 1`,
    [cursoId, docenteId, vigenciaId]
  );
  return Boolean(fila);
}

export async function crear({ cursoId, docenteId, vigenciaId }, connection) {
  const ejecutor = connection ?? pool;
  await ejecutor.execute(
    'INSERT INTO usuario_curso_vigencia (id_curso, id_vigencia, id_usuario) VALUES (?, ?, ?)',
    [cursoId, vigenciaId, docenteId]
  );
}

export async function eliminar({ cursoId, docenteId, vigenciaId }, connection) {
  const ejecutor = connection ?? pool;
  const [resultado] = await ejecutor.execute(
    'DELETE FROM usuario_curso_vigencia WHERE id_curso = ? AND id_vigencia = ? AND id_usuario = ?',
    [cursoId, vigenciaId, docenteId]
  );
  return resultado.affectedRows;
}
