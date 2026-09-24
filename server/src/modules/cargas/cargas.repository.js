import { query } from '../../config/db.js';

export async function cursosExistentes(ids) {
  if (!ids.length) {
    return new Set();
  }

  const filas = await query(
    `SELECT DISTINCT c.id
       FROM curso c
      WHERE c.id IN (${ids.map(() => '?').join(', ')})`,
    ids
  );

  return new Set(filas.map((curso) => curso.id));
}

// Chequeo en bloque contra la base para el archivo completo antes de
// insertar nada: trae de una sola vez que identificaciones, usuarios y
// correos del CSV ya estan registrados, igual que buscarOcupados en
// usuarios.repository.js pero con arreglos ya separados por campo.
export async function buscarOcupados({ identificaciones, usuarios, correos }) {
  if (!identificaciones.length) {
    return { identificaciones: new Set(), usuarios: new Set(), correos: new Set() };
  }

  const filas = await query(
    `SELECT identificacion, usuario, email
       FROM usuario
      WHERE identificacion IN (${identificaciones.map(() => '?').join(', ')})
         OR usuario IN (${usuarios.map(() => '?').join(', ')})
         OR email IN (${correos.map(() => '?').join(', ')})`,
    [...identificaciones, ...usuarios, ...correos]
  );

  return {
    identificaciones: new Set(filas.map((fila) => fila.identificacion)),
    usuarios: new Set(filas.map((fila) => fila.usuario)),
    correos: new Set(filas.map((fila) => fila.email))
  };
}

export async function matricularEstudiante(
  { id, identificacion, usuario, contrasena, nombre, apellido, email, idEstado, rol, idCurso, idVigencia },
  connection
) {
  await connection.execute(
    `INSERT INTO usuario (id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT id FROM rol WHERE nombre = ?))`,
    [id, identificacion, usuario, contrasena, nombre, apellido, email, idEstado, rol]
  );

  await connection.execute(
    'INSERT INTO usuario_curso_vigencia (id_curso, id_vigencia, id_usuario) VALUES (?, ?, ?)',
    [idCurso, idVigencia, id]
  );
}
