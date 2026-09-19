import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { crearApp } from '../src/app.js';
import { pool, query, queryOne } from '../src/config/db.js';
import { env } from '../src/config/env.js';

let server;
let baseUrl;

const ADMIN_TEST = {
  id: 999100,
  identificacion: '999100100',
  usuario: 'rh_admin',
  email: 'rh_admin@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 4, // Administrador
  idEstado: 1
};

const COORD_TEST = {
  id: 999101,
  identificacion: '999100101',
  usuario: 'rh_coord',
  email: 'rh_coord@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 1, // Coordinador
  idEstado: 1
};

const DOCENTE_TEST = {
  id: 999102,
  identificacion: '999100102',
  usuario: 'rh_docente',
  email: 'rh_docente@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 2, // Docente
  idEstado: 1
};

const ESTUDIANTE_TEST = {
  id: 999103,
  identificacion: '999100103',
  usuario: 'rh_estudiante',
  email: 'rh_estudiante@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 3, // Estudiante
  idEstado: 1
};

async function sembrar(u) {
  const hash = await bcrypt.hash(u.contrasenaPlano, env.bcryptRounds);
  await query(
    `INSERT INTO usuario (id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol)
     VALUES (?, ?, ?, ?, 'Actor', 'Prueba', ?, ?, ?)
     ON DUPLICATE KEY UPDATE contrasena = VALUES(contrasena), id_estado = VALUES(id_estado), id_rol = VALUES(id_rol)`,
    [u.id, u.identificacion, u.usuario, hash, u.email, u.idEstado, u.idRol]
  );
}

async function login(usuario, contrasena) {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, contrasena })
  });
  return { res, body: await res.json() };
}

test.before(async () => {
  process.env.NODE_ENV = 'test';
  await sembrar(ADMIN_TEST);
  await sembrar(COORD_TEST);
  await sembrar(DOCENTE_TEST);
  await sembrar(ESTUDIANTE_TEST);

  const app = crearApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  const ids = [ADMIN_TEST.id, COORD_TEST.id, DOCENTE_TEST.id, ESTUDIANTE_TEST.id];
  await query(`DELETE FROM logs WHERE id_usuario IN (${ids.map(() => '?').join(',')})`, ids);
  await query(`DELETE FROM usuario WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('Actores: La base de datos contiene los 4 roles requeridos', async () => {
  const roles = await query('SELECT id, nombre FROM rol ORDER BY id ASC');
  const mapa = new Map(roles.map((r) => [r.id, r.nombre]));

  assert.equal(mapa.get(1), 'Coordinador');
  assert.equal(mapa.get(2), 'Docente');
  assert.equal(mapa.get(3), 'Estudiante');
  assert.equal(mapa.get(4), 'Administrador');
});

test('Acceso al sistema: Bloqueo estricto de login a Coordinador (403)', async () => {
  const { res, body } = await login(COORD_TEST.usuario, COORD_TEST.contrasenaPlano);
  assert.equal(res.status, 403);
  assert.equal(body.error?.codigo, 'NO_AUTORIZADO');
  assert.equal(body.error?.mensaje, 'Acceso denegado: solo el usuario Administrador puede ingresar al sistema');
});

test('Acceso al sistema: Bloqueo estricto de login a Docente (403)', async () => {
  const { res, body } = await login(DOCENTE_TEST.usuario, DOCENTE_TEST.contrasenaPlano);
  assert.equal(res.status, 403);
  assert.equal(body.error?.codigo, 'NO_AUTORIZADO');
  assert.equal(body.error?.mensaje, 'Acceso denegado: solo el usuario Administrador puede ingresar al sistema');
});

test('Acceso al sistema: Bloqueo estricto de login a Estudiante (403)', async () => {
  const { res, body } = await login(ESTUDIANTE_TEST.usuario, ESTUDIANTE_TEST.contrasenaPlano);
  assert.equal(res.status, 403);
  assert.equal(body.error?.codigo, 'NO_AUTORIZADO');
  assert.equal(body.error?.mensaje, 'Acceso denegado: solo el usuario Administrador puede ingresar al sistema');
});

test('Acceso exclusivo: Administrador es el único que puede iniciar sesión (200)', async () => {
  const { res, body } = await login(ADMIN_TEST.usuario, ADMIN_TEST.contrasenaPlano);
  assert.equal(res.status, 200);
  assert.ok(body.data?.token);
  assert.equal(body.data?.usuario?.rol, 'Administrador');
});

test('RN03 Herencia: Administrador tiene roles efectivos sobre Coordinador, Docente y Estudiante', async () => {
  const { body } = await login(ADMIN_TEST.usuario, ADMIN_TEST.contrasenaPlano);
  const efectivos = body.data?.rolesEfectivos ?? [];

  assert.ok(efectivos.includes('Administrador'));
  assert.ok(efectivos.includes('Coordinador'));
  assert.ok(efectivos.includes('Docente'));
  assert.ok(efectivos.includes('Estudiante'));
});

test('RF03 Roles y permisos: Token de Administrador accede a rutas de Coordinador y Docente', async () => {
  const { body } = await login(ADMIN_TEST.usuario, ADMIN_TEST.contrasenaPlano);
  const token = body.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  // Ruta protegida por Coordinador: /usuarios
  const resUsuarios = await fetch(`${baseUrl}/usuarios`, { headers });
  assert.equal(resUsuarios.status, 200);

  // Ruta protegida por Coordinador: /auditoria
  const resAuditoria = await fetch(`${baseUrl}/auditoria`, { headers });
  assert.equal(resAuditoria.status, 200);

  // Ruta protegida por Docente: /cursos
  const resCursos = await fetch(`${baseUrl}/cursos`, { headers });
  assert.equal(resCursos.status, 200);

  // Ruta protegida por Docente: /asignaciones
  const resAsignaciones = await fetch(`${baseUrl}/asignaciones`, { headers });
  assert.equal(resAsignaciones.status, 200);
});
