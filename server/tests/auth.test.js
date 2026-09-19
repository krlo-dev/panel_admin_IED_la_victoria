import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { crearApp } from '../src/app.js';
import { pool, query, queryOne } from '../src/config/db.js';
import { env } from '../src/config/env.js';

let server;
let baseUrl;

// Usuarios de prueba autocontenidos: no dependen del seed compartido
// (database/script.sql) ni de que se haya corrido "npm run cifrar-seed".
// Se crean en test.before y se eliminan en test.after.
const ADMIN_PRUEBA = {
  id: 999900,
  identificacion: '999000900',
  usuario: 'test_admin',
  email: 'test_admin@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 4, // Administrador
  idEstado: 1 // Activo
};

const COORDINADOR_PRUEBA = {
  id: 999901,
  identificacion: '999000901',
  usuario: 'test_coord',
  email: 'test_coord@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 1, // Coordinador
  idEstado: 1 // Activo
};

const ESTUDIANTE_BLOQUEADO_PRUEBA = {
  id: 999902,
  identificacion: '999000902',
  usuario: 'test_bloqueado',
  email: 'test_bloqueado@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 3, // Estudiante
  idEstado: 2 // Bloqueado
};

async function sembrarUsuario(datos) {
  const hash = await bcrypt.hash(datos.contrasenaPlano, env.bcryptRounds);
  await query(
    `INSERT INTO usuario (id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol)
     VALUES (?, ?, ?, ?, 'Prueba', 'Automatica', ?, ?, ?)
     ON DUPLICATE KEY UPDATE contrasena = VALUES(contrasena), id_estado = VALUES(id_estado), id_rol = VALUES(id_rol)`,
    [datos.id, datos.identificacion, datos.usuario, hash, datos.email, datos.idEstado, datos.idRol]
  );
}

async function iniciarSesion(usuario, contrasena) {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, contrasena })
  });
  const body = await res.json();
  return { res, body };
}

test.before(async () => {
  process.env.NODE_ENV = 'test';
  await sembrarUsuario(ADMIN_PRUEBA);
  await sembrarUsuario(COORDINADOR_PRUEBA);
  await sembrarUsuario(ESTUDIANTE_BLOQUEADO_PRUEBA);

  const app = crearApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  await query('DELETE FROM logs WHERE id_usuario IN (?, ?, ?)', [
    ADMIN_PRUEBA.id,
    COORDINADOR_PRUEBA.id,
    ESTUDIANTE_BLOQUEADO_PRUEBA.id
  ]);
  await query('DELETE FROM usuario WHERE id IN (?, ?, ?)', [
    ADMIN_PRUEBA.id,
    COORDINADOR_PRUEBA.id,
    ESTUDIANTE_BLOQUEADO_PRUEBA.id
  ]);
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('GET /api/salud debe responder estado activo', async () => {
  const res = await fetch(`${baseUrl}/salud`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.data?.estado, 'activo');
});

test('POST /api/auth/login - Inicio de sesion exitoso con usuario administrador', async () => {
  const { res, body } = await iniciarSesion(ADMIN_PRUEBA.usuario, ADMIN_PRUEBA.contrasenaPlano);

  assert.equal(res.status, 200);
  assert.ok(body.data.token);
  assert.equal(body.data.usuario.usuario, ADMIN_PRUEBA.usuario);
  assert.equal(body.data.usuario.rol, 'Administrador');
  assert.deepEqual(body.data.rolesEfectivos, ['Administrador', 'Coordinador', 'Docente', 'Estudiante']);
});

test('POST /api/auth/login - Inicio de sesion exitoso con correo', async () => {
  const { res, body } = await iniciarSesion(ADMIN_PRUEBA.email, ADMIN_PRUEBA.contrasenaPlano);

  assert.equal(res.status, 200);
  assert.ok(body.data.token);
});

test('POST /api/auth/login - Inicio de sesion exitoso con documento de identidad', async () => {
  const { res, body } = await iniciarSesion(ADMIN_PRUEBA.identificacion, ADMIN_PRUEBA.contrasenaPlano);

  assert.equal(res.status, 200);
  assert.ok(body.data.token);
});

test('POST /api/auth/login - Rechaza roles no administradores como Coordinador (403)', async () => {
  const { res, body } = await iniciarSesion(COORDINADOR_PRUEBA.usuario, COORDINADOR_PRUEBA.contrasenaPlano);

  assert.equal(res.status, 403);
  assert.equal(
    body.error?.mensaje,
    'Acceso denegado: solo el usuario Administrador puede ingresar al sistema'
  );
});

test('POST /api/auth/login - Rechaza cuenta bloqueada (403)', async () => {
  const { res, body } = await iniciarSesion(
    ESTUDIANTE_BLOQUEADO_PRUEBA.usuario,
    ESTUDIANTE_BLOQUEADO_PRUEBA.contrasenaPlano
  );

  assert.equal(res.status, 403);
  assert.equal(body.error?.mensaje, 'La cuenta se encuentra bloqueada');
});

test('POST /api/auth/login - Falla con contrasena incorrecta (401)', async () => {
  const { res, body } = await iniciarSesion(ADMIN_PRUEBA.usuario, 'claveIncorrecta123*');

  assert.equal(res.status, 401);
  assert.equal(body.error?.mensaje, 'El usuario o la contraseña no son correctos');
});

test('POST /api/auth/login - Falla con usuario inexistente (401)', async () => {
  const { res, body } = await iniciarSesion('no_existe_jamas_999', 'CualquierClave123*');

  assert.equal(res.status, 401);
  assert.equal(body.error?.mensaje, 'El usuario o la contraseña no son correctos');
});

test('POST /api/auth/login - Validacion de esquema Zod en espanol (400)', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'ab', contrasena: '' })
  });

  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.error?.mensaje, 'Los datos enviados no son validos');
  assert.ok(Array.isArray(body.error?.detalles));
});

test('GET /api/auth/perfil - Consulta de perfil autenticado', async () => {
  const { body: loginBody } = await iniciarSesion(ADMIN_PRUEBA.usuario, ADMIN_PRUEBA.contrasenaPlano);
  const { token } = loginBody.data;

  const res = await fetch(`${baseUrl}/auth/perfil`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.data.usuario.usuario, ADMIN_PRUEBA.usuario);
  assert.ok(body.data.vigencia);
  assert.deepEqual(body.data.rolesEfectivos, ['Administrador', 'Coordinador', 'Docente', 'Estudiante']);
});

test('GET /api/auth/perfil - Rechazo sin token o con token alterado (401)', async () => {
  const resSinToken = await fetch(`${baseUrl}/auth/perfil`);
  assert.equal(resSinToken.status, 401);

  const resTokenFalso = await fetch(`${baseUrl}/auth/perfil`, {
    headers: { Authorization: 'Bearer token_invalido_falso' }
  });
  assert.equal(resTokenFalso.status, 401);
});

test('POST /api/auth/contrasena - Cambio de contrasena y verificacion', async () => {
  const { body: loginBody } = await iniciarSesion(ADMIN_PRUEBA.usuario, ADMIN_PRUEBA.contrasenaPlano);
  const { token } = loginBody.data;
  const nuevaClave = 'NuevaClavePrueba2026*';

  const resErronea = await fetch(`${baseUrl}/auth/contrasena`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ actual: 'ClaveMala999*', nueva: nuevaClave })
  });
  assert.equal(resErronea.status, 401);

  const resExito = await fetch(`${baseUrl}/auth/contrasena`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ actual: ADMIN_PRUEBA.contrasenaPlano, nueva: nuevaClave })
  });
  assert.equal(resExito.status, 200);

  const { res: resLoginNuevo, body: loginNuevoBody } = await iniciarSesion(ADMIN_PRUEBA.usuario, nuevaClave);
  assert.equal(resLoginNuevo.status, 200);

  const resRevertir = await fetch(`${baseUrl}/auth/contrasena`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginNuevoBody.data.token}` },
    body: JSON.stringify({ actual: nuevaClave, nueva: ADMIN_PRUEBA.contrasenaPlano })
  });
  assert.equal(resRevertir.status, 200);
});

test('POST /api/auth/cerrar-sesion - Cierre de sesion y registro en logs', async () => {
  const { body: loginBody } = await iniciarSesion(ADMIN_PRUEBA.usuario, ADMIN_PRUEBA.contrasenaPlano);
  const { token } = loginBody.data;

  const logoutRes = await fetch(`${baseUrl}/auth/cerrar-sesion`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(logoutRes.status, 200);

  const log = await queryOne(
    `SELECT accion, mistake FROM logs WHERE id_usuario = ? AND accion = 'CIERRE_SESION' ORDER BY id DESC LIMIT 1`,
    [ADMIN_PRUEBA.id]
  );
  assert.ok(log);
  assert.equal(log.accion, 'CIERRE_SESION');
});

test('Verificacion de auditoria en base de datos (RF07)', async () => {
  const logsRecientes = await query(
    `SELECT accion, entidad, mistake FROM logs WHERE id_usuario = ? AND accion IN ('INICIO_SESION', 'CAMBIO_CONTRASENA', 'CIERRE_SESION') ORDER BY id DESC LIMIT 5`,
    [ADMIN_PRUEBA.id]
  );
  assert.ok(logsRecientes.length > 0);
});
