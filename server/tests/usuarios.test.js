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
  id: 999200,
  identificacion: '999200000',
  usuario: 'usr_admin',
  email: 'usr_admin@iedlavictoria.edu.co',
  contrasenaPlano: 'ClaveDePrueba2026*',
  idRol: 4, // Administrador
  idEstado: 1
};

async function sembrarAdmin() {
  const hash = await bcrypt.hash(ADMIN_TEST.contrasenaPlano, env.bcryptRounds);
  await query(
    `INSERT INTO usuario (id, identificacion, usuario, contrasena, nombre, apellido, email, id_estado, id_rol)
     VALUES (?, ?, ?, ?, 'Admin', 'Usuarios', ?, ?, ?)
     ON DUPLICATE KEY UPDATE contrasena = VALUES(contrasena), id_estado = VALUES(id_estado), id_rol = VALUES(id_rol)`,
    [ADMIN_TEST.id, ADMIN_TEST.identificacion, ADMIN_TEST.usuario, hash, ADMIN_TEST.email, ADMIN_TEST.idEstado, ADMIN_TEST.idRol]
  );
}

async function limpiar() {
  await query('DELETE FROM logs WHERE id_usuario IN (SELECT id FROM usuario WHERE usuario LIKE ? OR id = ?)', ['usr_test_%', ADMIN_TEST.id]);
  await query('DELETE FROM usuario WHERE usuario LIKE ? OR id = ?', ['usr_test_%', ADMIN_TEST.id]);
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

test('RF01 Gestión de usuarios: Administrador crea un usuario con rol asignado', async () => {
  const nuevo = {
    identificacion: '999200001',
    usuario: 'usr_test_doc1',
    nombre: 'Carlos',
    apellido: 'Profesor',
    email: 'usr_test_doc1@iedlavictoria.edu.co',
    rol: 'Docente'
  };

  const res = await fetch(`${baseUrl}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify(nuevo)
  });

  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.data?.identificacion, nuevo.identificacion);
  assert.equal(body.data?.rol, 'Docente');
  assert.equal(body.data?.estado, 'Activo');
});

test('RN01 Contraseña inicial y RNF01 Seguridad: La contraseña por defecto es el documento cifrado con bcrypt', async () => {
  const fila = await queryOne('SELECT contrasena, identificacion FROM usuario WHERE identificacion = ?', ['999200001']);
  assert.ok(fila);
  assert.ok(fila.contrasena.startsWith('$2'), 'La contraseña debe tener prefijo bcrypt $2');

  const coincide = await bcrypt.compare(fila.identificacion, fila.contrasena);
  assert.equal(coincide, true, 'La contraseña inicial debe corresponder al número de identificación');
});

test('RN02 Identificación única: Rechaza registrar identificación duplicada (409)', async () => {
  const duplicado = {
    identificacion: '999200001', // Ya registrada
    usuario: 'usr_test_otro',
    nombre: 'Otro',
    apellido: 'Docente',
    email: 'usr_test_otro@iedlavictoria.edu.co',
    rol: 'Docente'
  };

  const res = await fetch(`${baseUrl}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify(duplicado)
  });

  const body = await res.json();
  assert.equal(res.status, 409);
  assert.equal(body.error?.codigo, 'CONFLICTO');
  assert.equal(body.error?.mensaje, 'Ya existe un usuario con esa identificacion');
});

test('RF01 Consultar y listar: El Administrador puede consultar detalle y listado con búsqueda', async () => {
  const usuarioEnBd = await queryOne('SELECT id FROM usuario WHERE identificacion = ?', ['999200001']);

  // Detalle por ID
  const resDetalle = await fetch(`${baseUrl}/usuarios/${usuarioEnBd.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const bodyDetalle = await resDetalle.json();
  assert.equal(resDetalle.status, 200);
  assert.equal(bodyDetalle.data?.usuario, 'usr_test_doc1');

  // Listar con búsqueda del administrador (cuenta institucional permanente)
  const resLista = await fetch(`${baseUrl}/usuarios?busqueda=usr_admin`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const bodyLista = await resLista.json();
  assert.equal(resLista.status, 200);
  assert.ok(Array.isArray(bodyLista.data));
  assert.ok(bodyLista.data.length >= 1);
  assert.equal(bodyLista.meta?.total >= 1, true);
});

test('RF01 Modificar usuario: El Administrador puede actualizar correo y nombre', async () => {
  const usuarioEnBd = await queryOne('SELECT id FROM usuario WHERE identificacion = ?', ['999200001']);

  const res = await fetch(`${baseUrl}/usuarios/${usuarioEnBd.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      nombre: 'Carlos Modificado',
      email: 'usr_test_doc1_nuevo@iedlavictoria.edu.co'
    })
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.data?.nombre, 'Carlos Modificado');
  assert.equal(body.data?.email, 'usr_test_doc1_nuevo@iedlavictoria.edu.co');
});

test('RF01 Cambiar estado: El Administrador puede desactivar (bloquear) y reactivar usuario', async () => {
  const usuarioEnBd = await queryOne('SELECT id FROM usuario WHERE identificacion = ?', ['999200001']);

  // Bloquear
  const resBloqueo = await fetch(`${baseUrl}/usuarios/${usuarioEnBd.id}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ activo: false })
  });
  const bodyBloqueo = await resBloqueo.json();
  assert.equal(resBloqueo.status, 200);
  assert.equal(bodyBloqueo.data?.estado, 'Bloqueado');

  // Reactivar
  const resActivar = await fetch(`${baseUrl}/usuarios/${usuarioEnBd.id}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ activo: true })
  });
  const bodyActivar = await resActivar.json();
  assert.equal(resActivar.status, 200);
  assert.equal(bodyActivar.data?.estado, 'Activo');
});

test('RN01 Restablecer contraseña: La contraseña vuelve a corresponder al documento cifrado', async () => {
  const usuarioEnBd = await queryOne('SELECT id FROM usuario WHERE identificacion = ?', ['999200001']);

  const res = await fetch(`${baseUrl}/usuarios/${usuarioEnBd.id}/contrasena`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.data?.mensaje, 'Contrasena restablecida a la identificacion del usuario');

  const fila = await queryOne('SELECT contrasena FROM usuario WHERE id = ?', [usuarioEnBd.id]);
  const coincide = await bcrypt.compare('999200001', fila.contrasena);
  assert.equal(coincide, true);
});

test('RNF10 Validación en el servidor: Zod rechaza campos mal formados con 400', async () => {
  const invalido = {
    identificacion: '123', // Muy corta, mínimo 6 dígitos
    usuario: 'ab', // Muy corto
    nombre: 'A',
    apellido: 'B',
    email: 'correo-no-valido',
    rol: 'RolInexistente'
  };

  const res = await fetch(`${baseUrl}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify(invalido)
  });

  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.error?.codigo, 'SOLICITUD_INVALIDA');
  assert.equal(body.error?.mensaje, 'Los datos enviados no son validos');
  assert.ok(Array.isArray(body.error?.detalles));
});
