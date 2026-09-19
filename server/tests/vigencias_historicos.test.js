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
  id: 999500,
  identificacion: '999500000',
  usuario: 'vg_admin',
  email: 'vg_admin@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 4, // Administrador
  idEstado: 1
};

async function sembrarAdmin() {
  const hash = await bcrypt.hash(ADMIN_TEST.contrasenaPlano, env.bcryptRounds);
  await query(
    `INSERT INTO usuario (id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol)
     VALUES (?, ?, ?, ?, 'Admin', 'Vigencias', ?, ?, ?)
     ON DUPLICATE KEY UPDATE contrasena = VALUES(contrasena), id_estado = VALUES(id_estado), id_rol = VALUES(id_rol)`,
    [ADMIN_TEST.id, ADMIN_TEST.identificacion, ADMIN_TEST.usuario, hash, ADMIN_TEST.email, ADMIN_TEST.idEstado, ADMIN_TEST.idRol]
  );
}

async function restaurarVigencias() {
  await query("UPDATE configuracion SET valor = '2026' WHERE clave = 'vigencia_activa'");
  await query('DELETE FROM vigencia WHERE id IN (2025, 2027)');
  await query('DELETE FROM logs WHERE id_usuario = ?', [ADMIN_TEST.id]);
  await query('DELETE FROM usuario WHERE id = ?', [ADMIN_TEST.id]);
}

test.before(async () => {
  process.env.NODE_ENV = 'test';
  await restaurarVigencias();
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
  await restaurarVigencias();
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('RF06 y RN06 Vigencia activa: Por defecto las consultas responden usando la vigencia activa (2026)', async () => {
  const res = await fetch(`${baseUrl}/cursos`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert.equal(res.status, 200);

  // Consultar listado de vigencias para comprobar cuál está marcada como activa
  const resVigencias = await fetch(`${baseUrl}/vigencias`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const bodyVigencias = await resVigencias.json();
  assert.equal(resVigencias.status, 200);
  assert.ok(Array.isArray(bodyVigencias.data));

  const activa = bodyVigencias.data.find((v) => v.activa === true);
  assert.ok(activa);
  assert.equal(activa.anio, 2026);
});

test('RF06 Crear vigencia: El Administrador puede registrar un nuevo año lectivo (201)', async () => {
  const nueva = {
    anio: 2027,
    fechaInicio: '2027-01-15',
    fechaFin: '2027-11-30'
  };

  const res = await fetch(`${baseUrl}/vigencias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify(nueva)
  });

  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.data?.anio, 2027);
  assert.equal(body.data?.activa, false);
});

test('RF06 Activar vigencia: El Administrador puede cambiar la vigencia activa del sistema', async () => {
  const res = await fetch(`${baseUrl}/vigencias/2027/activar`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.data?.anio, 2027);
  assert.equal(body.data?.activa, true);

  // Volver a activar 2026 para mantener la coherencia
  const resVolver = await fetch(`${baseUrl}/vigencias/2026/activar`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(resVolver.status, 200);
});

test('RN05 Conservación de históricos: Creación y consulta de vigencia histórica anterior sin eliminarse', async () => {
  // Crear vigencia histórica 2025
  await pool.execute('INSERT INTO vigencia (id, fecha_inicio, fecha_fin) VALUES (2025, ?, ?)', [
    '2025-01-15',
    '2025-11-30'
  ]);

  // Consulta explícita por vigencia histórica con parámetro ?anio=2025
  const resHistorico = await fetch(`${baseUrl}/asignaciones?anio=2025`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert.equal(resHistorico.status, 200);
  const bodyHistorico = await resHistorico.json();
  assert.ok(Array.isArray(bodyHistorico.data));

  // Comprobar que en la base de datos persisten tanto 2025 como 2026
  const filas = await query('SELECT id FROM vigencia WHERE id IN (2025, 2026)');
  assert.equal(filas.length, 2, 'Los registros de vigencias anteriores no se eliminan y se conservan');
});
