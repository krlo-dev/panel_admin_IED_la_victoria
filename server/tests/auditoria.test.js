import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { crearApp } from '../src/app.js';
import { pool, query, queryOne } from '../src/config/db.js';
import { env } from '../src/config/env.js';

let server;
let baseUrl;
let adminToken;

const ADMIN_TEST = {
  id: 999600,
  identificacion: '999600000',
  usuario: 'aud_admin',
  email: 'aud_admin@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 4, // Administrador
  idEstado: 1
};

async function sembrarAdmin() {
  const hash = await bcrypt.hash(ADMIN_TEST.contrasenaPlano, env.bcryptRounds);
  await query(
    `INSERT INTO usuario (id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol)
     VALUES (?, ?, ?, ?, 'Admin', 'Auditoria', ?, ?, ?)
     ON DUPLICATE KEY UPDATE contrasena = VALUES(contrasena), id_estado = VALUES(id_estado), id_rol = VALUES(id_rol)`,
    [ADMIN_TEST.id, ADMIN_TEST.identificacion, ADMIN_TEST.usuario, hash, ADMIN_TEST.email, ADMIN_TEST.idEstado, ADMIN_TEST.idRol]
  );
}

async function limpiar() {
  await query('DELETE FROM logs WHERE id_usuario = ? OR mistake LIKE ?', [ADMIN_TEST.id, '%aud_test_%']);
  await query('DELETE FROM usuario WHERE id = ? OR usuario LIKE ?', [ADMIN_TEST.id, 'aud_test_%']);
}

test.before(async () => {
  process.env.NODE_ENV = 'test';
  await limpiar();
  await sembrarAdmin();

  const app = crearApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}/api`;
      resolve();
    });
  });

  const resLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: ADMIN_TEST.usuario, contrasena: ADMIN_TEST.contrasenaPlano })
  });
  const dataLogin = await resLogin.json();
  adminToken = dataLogin.data?.token;
});

test.after(async () => {
  await limpiar();
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('RF07 y RNF08 Consulta de auditoría: El Administrador puede consultar el registro de auditoría', async () => {
  const res = await fetch(`${baseUrl}/auditoria`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length >= 1, 'Debe registrar al menos el inicio de sesión del Administrador');
  assert.equal(typeof body.meta?.total, 'number');
});

test('RF07 Trazabilidad de operaciones: La creación de un usuario genera registro de auditoría automático', async () => {
  // Crear un usuario para provocar el evento de auditoría
  const resCrear = await fetch(`${baseUrl}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      identificacion: '999600001',
      usuario: 'aud_test_u1',
      nombre: 'Prueba',
      apellido: 'Auditoria',
      email: 'aud_test_u1@iedlavictoria.edu.co',
      rol: 'Docente'
    })
  });
  assert.equal(resCrear.status, 201);

  // Verificar que en la tabla logs exista la acción 'CREACION' para este usuario
  const log = await queryOne(
    `SELECT accion, entidad, mistake, id_usuario
       FROM logs
      WHERE id_usuario = ? AND accion = 'CREACION' AND mistake LIKE ?
      LIMIT 1`,
    [ADMIN_TEST.id, '%aud_test_u1%']
  );

  assert.ok(log, 'Debe haberse insertado el log en la base de datos');
  assert.equal(log.accion, 'CREACION');
  assert.equal(log.entidad, 'usuario');
  assert.equal(log.id_usuario, ADMIN_TEST.id);
});

test('RF07 Filtros de auditoría: Filtra registros por acción específica (INICIO_SESION)', async () => {
  const res = await fetch(`${baseUrl}/auditoria?accion=INICIO_SESION`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.data));

  // Todos los registros devueltos deben ser de tipo INICIO_SESION
  const todasInicio = body.data.every((l) => l.accion === 'INICIO_SESION');
  assert.equal(todasInicio, true);
});

test('RF07 Paginación de auditoría: Respeta límite y página en la respuesta', async () => {
  const res = await fetch(`${baseUrl}/auditoria?limite=2&pagina=1`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length <= 2);
  assert.equal(body.meta?.limite, 2);
  assert.equal(body.meta?.pagina, 1);
});
