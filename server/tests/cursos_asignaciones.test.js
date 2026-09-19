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
  id: 999300,
  identificacion: '999300000',
  usuario: 'ca_admin',
  email: 'ca_admin@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 4, // Administrador
  idEstado: 1
};

// Docente de prueba para asignación
const DOCENTE_TEST = {
  id: 999301,
  identificacion: '999300001',
  usuario: 'ca_docente',
  email: 'ca_docente@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 2, // Docente
  idEstado: 1
};

async function sembrar(u) {
  const hash = await bcrypt.hash(u.contrasenaPlano, env.bcryptRounds);
  await query(
    `INSERT INTO usuario (id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol)
     VALUES (?, ?, ?, ?, 'Prueba', 'Asignacion', ?, ?, ?)
     ON DUPLICATE KEY UPDATE contrasena = VALUES(contrasena), id_estado = VALUES(id_estado), id_rol = VALUES(id_rol)`,
    [u.id, u.identificacion, u.usuario, hash, u.email, u.idEstado, u.idRol]
  );
}

async function limpiar() {
  await query('DELETE FROM usuario_curso_vigencia WHERE id_usuario = ?', [DOCENTE_TEST.id]);
  await query('DELETE FROM logs WHERE id_usuario IN (?, ?)', [ADMIN_TEST.id, DOCENTE_TEST.id]);
  await query('DELETE FROM usuario WHERE id IN (?, ?)', [ADMIN_TEST.id, DOCENTE_TEST.id]);
}

test.before(async () => {
  process.env.NODE_ENV = 'test';
  await limpiar();
  await sembrar(ADMIN_TEST);
  await sembrar(DOCENTE_TEST);

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

test('RN04 Visualización de cursos: Administrador ve todos los cursos y todos son administrables', async () => {
  const res = await fetch(`${baseUrl}/cursos`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length >= 20, 'Debe devolver el catálogo institucional de cursos');

  // Para el Administrador todos los cursos tienen administrable = true
  const todosAdministrables = body.data.every((c) => c.administrable === true);
  assert.equal(todosAdministrables, true, 'Todos los cursos deben ser administrables para el Administrador');
});

test('RN04 Detalle de curso: Consulta individual muestra administrable = true para el Administrador', async () => {
  const res = await fetch(`${baseUrl}/cursos/111`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.data?.id, 111);
  assert.equal(body.data?.grado, '1A');
  assert.equal(body.data?.administrable, true);
});

test('RF04 Asignación de tutores: El Administrador asigna un docente como tutor a un curso (201)', async () => {
  const res = await fetch(`${baseUrl}/asignaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      cursoId: 111,
      docenteId: DOCENTE_TEST.id
    })
  });

  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.data?.cursoId, 111);
  assert.equal(body.data?.docenteId, DOCENTE_TEST.id);
  assert.equal(body.data?.vigenciaId, 2026);
});

test('RF04 Duplicados de asignación: Rechaza asignar nuevamente al docente al mismo curso en la vigencia (409)', async () => {
  const res = await fetch(`${baseUrl}/asignaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      cursoId: 111,
      docenteId: DOCENTE_TEST.id
    })
  });

  const body = await res.json();
  assert.equal(res.status, 409);
  assert.equal(body.error?.codigo, 'CONFLICTO');
  assert.equal(body.error?.mensaje, 'El docente ya esta asignado a ese curso en la vigencia');
});

test('RF04 Consultar asignaciones: El Administrador lista las asignaciones de la vigencia activa', async () => {
  const res = await fetch(`${baseUrl}/asignaciones?curso=111`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.data));
  const encontrada = body.data.find((c) => c.cursoId === 111 && c.docenteId === DOCENTE_TEST.id);
  assert.ok(encontrada, 'La asignación creada debe aparecer en el listado');
});

test('RF04 Retirar asignación: El Administrador desasigna al docente del curso (204)', async () => {
  const res = await fetch(`${baseUrl}/asignaciones/111/${DOCENTE_TEST.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert.equal(res.status, 204);

  // Comprobar que ya no existe
  const fila = await queryOne(
    'SELECT 1 FROM usuario_curso_vigencia WHERE id_curso = 111 AND id_usuario = ? AND id_vigencia = 2026',
    [DOCENTE_TEST.id]
  );
  assert.equal(fila, null);
});

test('RF04 Retirar asignación inexistente responde 404', async () => {
  const res = await fetch(`${baseUrl}/asignaciones/111/${DOCENTE_TEST.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const body = await res.json();
  assert.equal(res.status, 404);
  assert.equal(body.error?.codigo, 'NO_ENCONTRADO');
});
