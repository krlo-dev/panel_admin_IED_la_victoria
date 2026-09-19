import test from 'node:test';
import assert from 'node:assert/strict';
import { crearApp } from '../src/app.js';
import { pool, query, queryOne } from '../src/config/db.js';

let server;
let baseUrl;

test.before(async () => {
  process.env.NODE_ENV = 'test';
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
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('GET /api/salud debe responder estado activo', async () => {
  const res = await fetch(`${baseUrl}/salud`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.data?.estado, 'activo');
});

test('POST /api/auth/login - Inicio de sesión exitoso de Admin (id_rol = 4) con nombre de usuario', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: 'admin',
      contrasena: '12345'
    })
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.data.token);
  assert.equal(body.data.usuario.usuario, 'admin');
  assert.equal(body.data.usuario.rol, 'admin');
  assert.equal(body.data.usuario.idRol, 4);
  assert.deepEqual(body.data.rolesEfectivos, ['admin', 'Coordinador', 'Docente']);
});

test('POST /api/auth/login - Inicio de sesión exitoso de Admin con documento de identidad', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: '123456789', // identificacion del admin
      contrasena: '12345'
    })
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.data.token);
  assert.equal(body.data.usuario.usuario, 'admin');
});

test('POST /api/auth/login - Inicio de sesión exitoso de Admin con correo', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: 'admin@correo.com',
      contrasena: '12345'
    })
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.data.token);
  assert.equal(body.data.usuario.usuario, 'admin');
});

test('POST /api/auth/login - Rechazo con 403 para usuarios sin id_rol = 4', async () => {
  // Intentar con coordinador (id_rol = 1)
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: 'coordinador',
      contrasena: 'Temporal2026*'
    })
  });

  const body = await res.json();
  assert.equal(res.status, 403);
  assert.ok(body.error?.mensaje.includes('Administrador'));
});

test('POST /api/auth/login - Falla con contraseña incorrecta (401)', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: 'admin',
      contrasena: 'claveIncorrecta123*'
    })
  });

  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.error?.mensaje, 'El usuario o la contraseña no son correctos');
});

test('POST /api/auth/login - Falla con usuario inexistente (401)', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: 'no_existe_jamás_999',
      contrasena: 'CualquierClave123*'
    })
  });

  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.error?.mensaje, 'El usuario o la contraseña no son correctos');
});

test('POST /api/auth/login - Validación de esquema Zod en español (400)', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: 'ab',
      contrasena: ''
    })
  });

  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.error?.mensaje, 'Los datos enviados no son validos');
  assert.ok(Array.isArray(body.error?.detalles));
});

test('GET /api/auth/perfil - Consulta de perfil de Admin autenticado', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'admin', contrasena: '12345' })
  });
  const { data: { token } } = await loginRes.json();

  const res = await fetch(`${baseUrl}/auth/perfil`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.data.usuario.usuario, 'admin');
  assert.ok(body.data.vigencia);
  assert.deepEqual(body.data.rolesEfectivos, ['admin', 'Coordinador', 'Docente']);
});

test('GET /api/auth/perfil - Rechazo sin token o token alterado (401)', async () => {
  const resSinToken = await fetch(`${baseUrl}/auth/perfil`);
  assert.equal(resSinToken.status, 401);

  const resTokenFalso = await fetch(`${baseUrl}/auth/perfil`, {
    headers: { Authorization: 'Bearer token_invalido_falso' }
  });
  assert.equal(resTokenFalso.status, 401);
});

test('POST /api/auth/contrasena - Cambio de contraseña y verificación para Admin', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'admin', contrasena: '12345' })
  });
  const { data: { token } } = await loginRes.json();

  // Intento con clave actual errónea
  const resErronea = await fetch(`${baseUrl}/auth/contrasena`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      actual: 'ClaveMala999*',
      nueva: 'NuevaClaveAdmin2026*'
    })
  });
  assert.equal(resErronea.status, 401);

  // Cambio exitoso
  const resExito = await fetch(`${baseUrl}/auth/contrasena`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      actual: '12345',
      nueva: 'NuevaClaveAdmin2026*'
    })
  });
  assert.equal(resExito.status, 200);

  // Probar login con nueva contraseña
  const loginNuevo = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'admin', contrasena: 'NuevaClaveAdmin2026*' })
  });
  assert.equal(loginNuevo.status, 200);
  const { data: { token: tokenNuevo } } = await loginNuevo.json();

  // Revertir a 12345
  const resRevertir = await fetch(`${baseUrl}/auth/contrasena`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenNuevo}`
    },
    body: JSON.stringify({
      actual: 'NuevaClaveAdmin2026*',
      nueva: '12345'
    })
  });
  assert.equal(resRevertir.status, 200);
});

test('POST /api/auth/cerrar-sesion - Cierre de sesión de Admin y registro en logs', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'admin', contrasena: '12345' })
  });
  const { data: { token } } = await loginRes.json();

  const logoutRes = await fetch(`${baseUrl}/auth/cerrar-sesion`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(logoutRes.status, 200);

  const log = await queryOne(
    `SELECT accion, mistake FROM logs WHERE id_usuario = (SELECT id FROM usuario WHERE usuario = 'admin') AND accion = 'CIERRE_SESION' ORDER BY id DESC LIMIT 1`
  );
  assert.ok(log);
  assert.equal(log.accion, 'CIERRE_SESION');
});

test('Verificación de auditoría en Base de Datos (RF07)', async () => {
  const logsRecientes = await query(
    `SELECT accion, entidad, mistake FROM logs WHERE accion IN ('INICIO_SESION', 'CAMBIO_CONTRASENA', 'CIERRE_SESION') ORDER BY id DESC LIMIT 5`
  );
  assert.ok(logsRecientes.length > 0);
});
