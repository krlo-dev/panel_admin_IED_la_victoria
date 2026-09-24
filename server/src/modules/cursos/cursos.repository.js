import { pool, query, queryOne } from '../../config/db.js';
import { ROLES } from '../../shared/roles.js';
import { ESTADOS } from '../../shared/estados.js';

export async function listar({ vigenciaId, busqueda, soloConEstudiantes }) {
  // El curso es permanente (no pertenece a una vigencia especifica, ver RN05),
  // asi que la lista muestra todos los cursos que existan, incluidos los que
  // todavia no tienen a nadie matriculado en la vigencia consultada. Solo los
  // conteos de abajo son especificos de esa vigencia, y solo cuentan usuarios
  // activos, para que coincidan con lo que se ve al entrar al detalle del
  // curso (ahi tambien se ocultan los bloqueados).
  const parametros = [
    ROLES.ESTUDIANTE,
    vigenciaId,
    ESTADOS.ACTIVO,
    ROLES.DOCENTE,
    vigenciaId,
    ESTADOS.ACTIVO
  ];
  const condiciones = [];

  if (busqueda) {
    condiciones.push('c.grado LIKE ?');
    parametros.push(`%${busqueda}%`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  // Solo para la vista de listado (ver soloConEstudiantes en cursos.schemas.js):
  // oculta cursos "fantasma" que tuvieron matriculas en otra vigencia pero
  // ninguna en la consultada. Un curso que JAMAS ha tenido a nadie, en
  // ninguna vigencia, se sigue mostrando (para poder gestionarlo/eliminarlo).
  // No afecta a quien pide el catalogo completo (crear usuario, carga masiva).
  const having = soloConEstudiantes
    ? `HAVING estudiantes > 0
        OR NOT EXISTS (SELECT 1 FROM usuario_curso_vigencia ucv WHERE ucv.id_curso = c.id)`
    : '';

  return query(
    `SELECT c.id,
            c.grado,
            (SELECT COUNT(*)
               FROM usuario_curso_vigencia x
               JOIN usuario ux ON ux.id = x.id_usuario
               JOIN rol rx ON rx.id = ux.id_rol
              WHERE x.id_curso = c.id AND rx.nombre = ? AND x.id_vigencia = ? AND ux.id_estado = ?) AS estudiantes,
            (SELECT COUNT(*)
               FROM usuario_curso_vigencia y
               JOIN usuario uy ON uy.id = y.id_usuario
               JOIN rol ry ON ry.id = uy.id_rol
              WHERE y.id_curso = c.id AND ry.nombre = ? AND y.id_vigencia = ? AND uy.id_estado = ?) AS docentes
       FROM curso c
       ${where}
      ${having}
      ORDER BY c.id`,
    parametros
  );
}

export async function buscarPorId(id) {
  return queryOne('SELECT id, grado FROM curso WHERE id = ? LIMIT 1', [id]);
}

export async function crear({ id, grado }, connection) {
  const ejecutor = connection ?? pool;
  await ejecutor.execute('INSERT INTO curso (id, grado) VALUES (?, ?)', [id, grado]);
}

// El curso solo se puede borrar si nunca tuvo a nadie matriculado, en
// ninguna vigencia: usuario_curso_vigencia.id_curso tiene una llave foranea
// hacia curso sin cascada (ver database/script.sql), asi que intentar borrar
// un curso con matriculas fallaria en la base de todas formas. Se valida
// antes para poder devolver un mensaje claro en vez de un error de MySQL.
export async function tieneMatriculas(id) {
  const fila = await queryOne(
    'SELECT 1 AS coincide FROM usuario_curso_vigencia WHERE id_curso = ? LIMIT 1',
    [id]
  );
  return Boolean(fila);
}

export async function eliminar(id, connection) {
  const ejecutor = connection ?? pool;
  await ejecutor.execute('DELETE FROM curso WHERE id = ?', [id]);
}

export async function integrantes(cursoId, vigenciaId) {
  // Un usuario bloqueado deja de aparecer al consultar el curso: esta vista
  // es operativa (a quien contactar hoy), no un historial de matriculas.
  return query(
    `SELECT u.id, u.nombre, u.apellido, u.email, u.identificacion, r.nombre AS rol
       FROM usuario_curso_vigencia ucv
       JOIN usuario u ON u.id = ucv.id_usuario
       JOIN rol r ON r.id = u.id_rol
      WHERE ucv.id_curso = ? AND ucv.id_vigencia = ? AND u.id_estado = ?
      ORDER BY r.nombre, u.apellido, u.nombre`,
    [cursoId, vigenciaId, ESTADOS.ACTIVO]
  );
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
