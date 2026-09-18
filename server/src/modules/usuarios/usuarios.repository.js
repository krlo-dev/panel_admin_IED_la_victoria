import { pool, query, queryOne } from '../../config/db.js';
import { siguienteId } from '../../shared/ids.js';

const SELECCION = `SELECT u.id,
       u.usuario,
       u.identificacion,
       u.nombre,
       u.apellido,
       u.email,
       u.id_estado AS idEstado,
       e.nombre AS estado,
       r.nombre AS rol
  FROM usuario u
  JOIN rol r ON r.id = u.id_rol
  JOIN estado e ON e.id = u.id_estado`;

export async function buscarPorId(id) {
  return queryOne(`${SELECCION} WHERE u.id = ? LIMIT 1`, [id]);
}

export async function buscarPorIdentificacion(identificacion) {
  return queryOne(`${SELECCION} WHERE u.identificacion = ? LIMIT 1`, [identificacion]);
}

export async function listar({ busqueda, rol, activo, curso, vigenciaId, pagina, limite }) {
  const condiciones = [];
  const parametros = [];
  let union = '';

  if (curso && vigenciaId) {
    union = 'JOIN usuario_curso_vigencia ucv ON ucv.id_usuario = u.id';
    condiciones.push('ucv.id_curso = ?', 'ucv.id_vigencia = ?');
    parametros.push(curso, vigenciaId);
  }

  if (busqueda) {
    condiciones.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.identificacion LIKE ? OR u.usuario LIKE ?)');
    const patron = `%${busqueda}%`;
    parametros.push(patron, patron, patron, patron);
  }
  if (rol) {
    condiciones.push('r.nombre = ?');
    parametros.push(rol);
  }
  if (activo !== undefined) {
    condiciones.push('u.id_estado = ?');
    parametros.push(activo ? 1 : 2);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const offset = (pagina - 1) * limite;

  const registros = await query(
    `SELECT u.id,
            u.usuario,
            u.identificacion,
            u.nombre,
            u.apellido,
            u.email,
            u.id_estado AS idEstado,
            e.nombre AS estado,
            r.nombre AS rol
       FROM usuario u
       ${union}
       JOIN rol r ON r.id = u.id_rol
       JOIN estado e ON e.id = u.id_estado
       ${where}
      ORDER BY u.apellido, u.nombre
      LIMIT ? OFFSET ?`,
    [...parametros, limite, offset]
  );

  const [{ total }] = await query(
    `SELECT COUNT(*) AS total
       FROM usuario u
       ${union}
       JOIN rol r ON r.id = u.id_rol
       ${where}`,
    parametros
  );

  return { registros, total: Number(total) };
}

export async function crear(datos, connection) {
  const ejecutor = connection ?? pool;
  const id = await siguienteId(ejecutor, 'usuario');

  await ejecutor.execute(
    `INSERT INTO usuario (id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT id FROM rol WHERE nombre = ?))`,
    [
      id,
      datos.identificacion,
      datos.usuario,
      datos.contrasena,
      datos.nombre,
      datos.apellido,
      datos.email,
      datos.idEstado,
      datos.rol
    ]
  );

  return id;
}

export async function actualizar(id, datos, connection) {
  const ejecutor = connection ?? pool;
  const campos = [];
  const parametros = [];

  if (datos.nombre !== undefined) {
    campos.push('nombre = ?');
    parametros.push(datos.nombre);
  }
  if (datos.apellido !== undefined) {
    campos.push('apellido = ?');
    parametros.push(datos.apellido);
  }
  if (datos.email !== undefined) {
    campos.push('email = ?');
    parametros.push(datos.email);
  }
  if (datos.rol !== undefined) {
    campos.push('id_rol = (SELECT id FROM rol WHERE nombre = ?)');
    parametros.push(datos.rol);
  }

  if (!campos.length) {
    return;
  }

  await ejecutor.execute(`UPDATE usuario SET ${campos.join(', ')} WHERE id = ?`, [...parametros, id]);
}

export async function cambiarEstado(id, idEstado, connection) {
  const ejecutor = connection ?? pool;
  await ejecutor.execute('UPDATE usuario SET id_estado = ? WHERE id = ?', [idEstado, id]);
}
