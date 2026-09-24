import { pool, queryOne } from '../../config/db.js';

const SELECCION = `SELECT u.id,
       u.usuario,
       u.identificacion,
       u.nombre,
       u.apellido,
       u.email,
       u.contrasena,
       u.id_estado AS idEstado,
       u.id_rol AS idRol,
       r.nombre AS rol
  FROM usuario u
  JOIN rol r ON r.id = u.id_rol`;

export async function buscarParaLogin(identificador) {
  return queryOne(
    `${SELECCION} WHERE u.usuario = ? OR u.email = ? OR u.identificacion = ? LIMIT 1`,
    [identificador, identificador, identificador]
  );
}

export async function buscarContrasena(id) {
  return queryOne('SELECT contrasena FROM usuario WHERE id = ? LIMIT 1', [id]);
}

export async function actualizarContrasena(id, contrasena, connection) {
  const ejecutor = connection ?? pool;
  await ejecutor.execute('UPDATE usuario SET contrasena = ? WHERE id = ?', [contrasena, id]);
}
