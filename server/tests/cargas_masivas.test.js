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
  id: 999400,
  identificacion: '999400000',
  usuario: 'cg_admin',
  email: 'cg_admin@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 4, // Administrador
  idEstado: 1
};

async function sembrarAdmin() {
  const hash = await bcrypt.hash(ADMIN_TEST.contrasenaPlano, env.bcryptRounds);
  await query(
    `INSERT INTO usuario (id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol)
     VALUES (?, ?, ?, ?, 'Admin', 'Cargas', ?, ?, ?)
     ON DUPLICATE KEY UPDATE contrasena = VALUES(contrasena), id_estado = VALUES(id_estado), id_rol = VALUES(id_rol)`,
    [ADMIN_TEST.id, ADMIN_TEST.identificacion, ADMIN_TEST.usuario, hash, ADMIN_TEST.email, ADMIN_TEST.idEstado, ADMIN_TEST.idRol]
  );
}

async function limpiar() {
  await query('DELETE FROM usuario_curso_vigencia WHERE id_usuario IN (SELECT id FROM usuario WHERE usuario LIKE ?)', ['cg_test_%']);
  await query('DELETE FROM logs WHERE id_usuario = ? OR mistake LIKE ?', [ADMIN_TEST.id, '%cg_test_%']);
  await query('DELETE FROM usuario WHERE id = ? OR usuario LIKE ?', [ADMIN_TEST.id, 'cg_test_%']);
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

test('RF05 y RN08 Formato de plantilla: Descarga plantilla CSV con el encabezado institucional exacto', async () => {
  const res = await fetch(`${baseUrl}/cargas/plantilla`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert.equal(res.status, 200);
  const texto = await res.text();
  const primeraLinea = texto.split(/\r?\n/)[0].trim();

  // RN08: Año,idCurso,Usuario,Identificación,Apellidos,Nombres,E-Mail
  assert.equal(primeraLinea, 'Año,idCurso,Usuario,Identificación,Apellidos,Nombres,E-Mail');
});

test('RN07 Carga sin resultados parciales: Archivo con errores se rechaza al 100% y no inserta filas parciales (422)', async () => {
  // Archivo con 2 filas: la primera válida, la segunda con error crítico (curso inexistente 99999 y año incorrecto)
  const csvConError = [
    'Año,idCurso,Usuario,Identificación,Apellidos,Nombres,E-Mail',
    '2026,111,cg_test_valido,999400010,Perez,Juan,cg_test_valido@iedlavictoria.edu.co',
    '2025,99999,cg_test_error,999400011,Gomez,Maria,cg_test_error@iedlavictoria.edu.co'
  ].join('\n');

  const formData = new FormData();
  formData.append('archivo', new Blob([csvConError], { type: 'text/csv' }), 'carga_erronea.csv');

  const res = await fetch(`${baseUrl}/cargas/usuarios`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData
  });

  const body = await res.json();
  assert.equal(res.status, 422);
  assert.equal(body.error?.codigo, 'REGLA_DE_NEGOCIO');
  assert.equal(body.error?.mensaje, 'El archivo tiene errores y no se procesa de forma parcial');
  assert.ok(Array.isArray(body.error?.detalles?.errores));

  // RN07 Verificación crucial: La fila válida (cg_test_valido) NO debe haberse guardado en la base de datos
  const noGuardado = await queryOne('SELECT id FROM usuario WHERE usuario = ?', ['cg_test_valido']);
  assert.equal(noGuardado, null, 'No deben persistirse registros parciales si el archivo tuvo errores');
});

test('RF05 Carga masiva exitosa: Procesa archivo limpio e inserta estudiantes con vigencia y curso', async () => {
  const csvLimpio = [
    'Año,idCurso,Usuario,Identificación,Apellidos,Nombres,E-Mail',
    '2026,111,cg_test_est1,999400021,Alvarez,Laura,cg_test_est1@iedlavictoria.edu.co',
    '2026,112,cg_test_est2,999400022,Castro,David,cg_test_est2@iedlavictoria.edu.co'
  ].join('\n');

  const formData = new FormData();
  formData.append('archivo', new Blob([csvLimpio], { type: 'text/csv' }), 'carga_correcta.csv');

  const res = await fetch(`${baseUrl}/cargas/usuarios`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: formData
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.data?.creados, 2);

  // Verificar que ambos usuarios quedaron en base de datos como Estudiante activo
  const est1 = await queryOne('SELECT u.id, u.id_rol, u.id_estado, r.nombre AS rol FROM usuario u JOIN rol r ON r.id = u.id_rol WHERE u.usuario = ?', ['cg_test_est1']);
  assert.ok(est1);
  assert.equal(est1.rol, 'Estudiante');
  assert.equal(est1.id_estado, 1);

  // Verificar que quedaron asociados al curso y la vigencia
  const enlace = await queryOne('SELECT id_curso, id_vigencia FROM usuario_curso_vigencia WHERE id_usuario = ?', [est1.id]);
  assert.ok(enlace);
  assert.equal(enlace.id_curso, 111);
  assert.equal(enlace.id_vigencia, 2026);
});
