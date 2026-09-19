import bcrypt from 'bcryptjs';
import { pool, queryOne } from '../../config/db.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../shared/httpError.js';
import { emitirToken } from '../../shared/token.js';
import { ESTADOS } from '../../shared/estados.js';
import { ID_ROLES } from '../../shared/roles.js';
import { vigenciaActiva } from '../../middlewares/vigenciaActiva.js';
import { registrar } from '../auditoria/auditoria.service.js';

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

export async function iniciarSesion({ usuario, contrasena }) {
  const encontrado = await queryOne(
    `${SELECCION} WHERE u.usuario = ? OR u.email = ? OR u.identificacion = ? LIMIT 1`,
    [usuario, usuario, usuario]
  );

  if (!encontrado) {
    throw HttpError.unauthorized('El usuario o la contraseña no son correctos');
  }

  if (!encontrado.contrasena.startsWith('$2')) {
    throw HttpError.unprocessable(
      'La contraseña de este usuario no está cifrada. Ejecute npm run cifrar-seed en el servidor'
    );
  }

  const coincide = await bcrypt.compare(contrasena, encontrado.contrasena);
  if (!coincide) {
    throw HttpError.unauthorized('El usuario o la contraseña no son correctos');
  }

  if (encontrado.idEstado !== ESTADOS.ACTIVO) {
    throw HttpError.forbidden('La cuenta se encuentra bloqueada');
  }

  if (encontrado.idRol !== ID_ROLES.ADMIN) {
    throw HttpError.forbidden('Acceso denegado: solo el usuario Administrador puede ingresar al sistema');
  }

  const perfil = { ...encontrado };
  delete perfil.contrasena;

  await registrar({
    responsable: perfil,
    accion: 'INICIO_SESION',
    entidad: 'usuario',
    entidadId: perfil.id,
    detalle: `Ingreso del usuario administrador ${perfil.usuario}`
  });

  return { token: emitirToken(perfil), usuario: perfil };
}

export async function perfil(usuario) {
  return { usuario, vigencia: await vigenciaActiva() };
}

export async function cambiarContrasena({ usuario, actual, nueva }) {
  const fila = await queryOne('SELECT contrasena FROM usuario WHERE id = ? LIMIT 1', [usuario.id]);

  if (!fila?.contrasena?.startsWith('$2') || !(await bcrypt.compare(actual, fila.contrasena))) {
    throw HttpError.unauthorized('La contraseña actual no es correcta');
  }

  const hash = await bcrypt.hash(nueva, env.bcryptRounds);
  await pool.execute('UPDATE usuario SET contrasena = ? WHERE id = ?', [hash, usuario.id]);

  await registrar({
    responsable: usuario,
    accion: 'CAMBIO_CONTRASENA',
    entidad: 'usuario',
    entidadId: usuario.id,
    detalle: `Cambio de contraseña de ${usuario.usuario}`
  });
}

export async function cerrarSesion(usuario) {
  await registrar({
    responsable: usuario,
    accion: 'CIERRE_SESION',
    entidad: 'usuario',
    entidadId: usuario.id,
    detalle: `Cierre de sesión de ${usuario.usuario}`
  });
}
