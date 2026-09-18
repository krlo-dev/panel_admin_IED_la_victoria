import { query, queryOne } from '../../config/db.js';
import { ROLES } from '../../shared/roles.js';

export async function listar({ vigenciaId, busqueda }) {
  const parametros = [ROLES.ESTUDIANTE, vigenciaId, ROLES.DOCENTE, vigenciaId, vigenciaId];
  let filtro = '';

  if (busqueda) {
    filtro = 'AND c.grado LIKE ?';
    parametros.push(`%${busqueda}%`);
  }

  return query(
    `SELECT c.id,
            c.grado,
            (SELECT COUNT(*)
               FROM usuario_curso_vigencia x
               JOIN usuario ux ON ux.id = x.id_usuario
               JOIN rol rx ON rx.id = ux.id_rol
              WHERE x.id_curso = c.id AND rx.nombre = ? AND x.id_vigencia = ?) AS estudiantes,
            (SELECT COUNT(*)
               FROM usuario_curso_vigencia y
               JOIN usuario uy ON uy.id = y.id_usuario
               JOIN rol ry ON ry.id = uy.id_rol
              WHERE y.id_curso = c.id AND ry.nombre = ? AND y.id_vigencia = ?) AS docentes
       FROM curso c
      WHERE EXISTS (SELECT 1
                      FROM usuario_curso_vigencia ucv
                     WHERE ucv.id_curso = c.id AND ucv.id_vigencia = ?)
        ${filtro}
      ORDER BY c.id`,
    parametros
  );
}

export async function buscarPorId(id) {
  return queryOne('SELECT id, grado FROM curso WHERE id = ? LIMIT 1', [id]);
}

export async function estaAsignado(cursoId, usuarioId, vigenciaId) {
  const fila = await queryOne(
    `SELECT 1 AS coincide
       FROM usuario_curso_vigencia
      WHERE id_curso = ? AND id_usuario = ? AND id_vigencia = ?
      LIMIT 1`,
    [cursoId, usuarioId, vigenciaId]
  );
  return Boolean(fila);
}

export async function cursosDelUsuario(usuarioId, vigenciaId) {
  return query(
    `SELECT c.id, c.grado
       FROM usuario_curso_vigencia ucv
       JOIN curso c ON c.id = ucv.id_curso
      WHERE ucv.id_usuario = ? AND ucv.id_vigencia = ?
      ORDER BY c.id`,
    [usuarioId, vigenciaId]
  );
}
