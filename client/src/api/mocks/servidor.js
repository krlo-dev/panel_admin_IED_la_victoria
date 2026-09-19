import { ROLES } from '../../shared/roles.js';
import { estado, nuevoIdUsuario, registrarAuditoria } from './datos.js';

const RETRASO_MS = 260;

function rolesEfectivos(rol) {
  if (rol === ROLES.COORDINADOR) return [ROLES.COORDINADOR, ROLES.DOCENTE];
  if (rol === ROLES.DOCENTE) return [ROLES.DOCENTE];
  return [ROLES.ESTUDIANTE];
}

function esperar() {
  return new Promise((resolver) => setTimeout(resolver, RETRASO_MS));
}

function error(status, mensaje, detalles) {
  const cuerpo = { error: { mensaje, ...(detalles ? { detalles } : {}) } };
  return { status, cuerpo };
}

function ok(data, meta) {
  return { status: 200, cuerpo: meta ? { data, meta } : { data } };
}

function creado(data) {
  return { status: 201, cuerpo: { data } };
}

function usuarioActual(token) {
  if (!token || !token.startsWith('demo:')) {
    return null;
  }
  const id = Number(token.slice(5));
  return estado.usuarios.find((u) => u.id === id) ?? null;
}

function sinContrasena(usuario) {
  const { ...copia } = usuario;
  return copia;
}

function vigenciaActiva() {
  const vigencia = estado.vigencias.find((v) => v.id === estado.vigenciaActivaId);
  return vigencia ? { id: vigencia.id, fechaInicio: vigencia.fechaInicio, fechaFin: vigencia.fechaFin } : null;
}

function resolverVigencia(query) {
  const solicitada = Number(query?.anio ?? 0);
  const activa = vigenciaActiva();
  if (!solicitada) {
    return { id: activa.id, anio: activa.id, activa: true };
  }
  return { id: solicitada, anio: solicitada, activa: solicitada === activa.id };
}

function manejarLogin(cuerpo) {
  const usuarioBuscado = String(cuerpo?.usuario ?? '').trim().toLowerCase();
  const contrasena = String(cuerpo?.contrasena ?? '');

  const encontrado = estado.usuarios.find(
    (u) => u.usuario.toLowerCase() === usuarioBuscado || u.email.toLowerCase() === usuarioBuscado
  );

  if (!encontrado || !contrasena) {
    return error(401, 'El usuario o la contrasena no son correctos');
  }
  if (encontrado.idEstado !== 1) {
    return error(403, 'La cuenta esta bloqueada');
  }

  registrarAuditoria({
    accion: 'INICIO_SESION',
    entidad: 'usuario',
    idEntidad: encontrado.id,
    detalle: `Ingreso del usuario ${encontrado.usuario}`,
    responsable: encontrado.usuario
  });

  return ok({
    token: `demo:${encontrado.id}`,
    usuario: sinContrasena(encontrado),
    rolesEfectivos: rolesEfectivos(encontrado.rol)
  });
}

function manejarPerfil(token) {
  const usuario = usuarioActual(token);
  if (!usuario) {
    return error(401, 'Sesion invalida');
  }
  return ok({
    usuario: sinContrasena(usuario),
    vigencia: vigenciaActiva(),
    rolesEfectivos: rolesEfectivos(usuario.rol)
  });
}

function manejarListarUsuarios(query) {
  let filas = [...estado.usuarios];

  if (query.busqueda) {
    const patron = query.busqueda.toLowerCase();
    filas = filas.filter((u) =>
      [u.nombre, u.apellido, u.identificacion, u.usuario].some((valor) => valor.toLowerCase().includes(patron))
    );
  }
  if (query.rol) {
    filas = filas.filter((u) => u.rol === query.rol);
  }
  if (query.activo !== undefined) {
    const activo = query.activo === 'true';
    filas = filas.filter((u) => (u.idEstado === 1) === activo);
  }

  filas.sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre));

  const pagina = Number(query.pagina ?? 1);
  const limite = Number(query.limite ?? 20);
  const total = filas.length;
  const inicio = (pagina - 1) * limite;
  const pagina_ = filas.slice(inicio, inicio + limite);

  return ok(pagina_, { pagina, limite, total, anio: estado.vigenciaActivaId });
}

function manejarCrearUsuario(cuerpo, responsable) {
  const { identificacion, usuario, nombre, apellido, email, rol } = cuerpo ?? {};

  if (!identificacion || !/^\d{6,20}$/.test(identificacion)) {
    return error(400, 'La identificacion debe tener entre 6 y 20 digitos');
  }
  if (!usuario || usuario.length < 4) {
    return error(400, 'El usuario debe tener al menos 4 caracteres');
  }
  if (!nombre || !apellido) {
    return error(400, 'Nombre y apellido son obligatorios');
  }
  if (!email || !email.includes('@')) {
    return error(400, 'El correo no es valido');
  }
  if (!Object.values(ROLES).includes(rol)) {
    return error(400, 'El rol no es valido');
  }
  if (estado.usuarios.some((u) => u.identificacion === identificacion || u.usuario === usuario || u.email === email)) {
    return error(409, 'La identificacion, el usuario o el correo ya estan registrados');
  }

  const nuevo = {
    id: nuevoIdUsuario(),
    identificacion,
    usuario,
    nombre,
    apellido,
    email,
    idEstado: 1,
    estado: 'Activo',
    rol
  };
  estado.usuarios.push(nuevo);

  registrarAuditoria({
    accion: 'CREACION',
    entidad: 'usuario',
    idEntidad: nuevo.id,
    detalle: `Usuario ${usuario} creado con rol ${rol}`,
    responsable: responsable?.usuario ?? 'sistema'
  });

  return creado({ id: nuevo.id });
}

function manejarActualizarUsuario(id, cuerpo, responsable) {
  const usuario = estado.usuarios.find((u) => u.id === id);
  if (!usuario) {
    return error(404, 'El usuario no existe');
  }
  ['nombre', 'apellido', 'email', 'rol'].forEach((campo) => {
    if (cuerpo?.[campo] !== undefined) {
      usuario[campo] = cuerpo[campo];
    }
  });

  registrarAuditoria({
    accion: 'ACTUALIZACION',
    entidad: 'usuario',
    idEntidad: id,
    detalle: `Usuario ${usuario.usuario} actualizado`,
    responsable: responsable?.usuario ?? 'sistema'
  });

  return ok(sinContrasena(usuario));
}

function manejarCambiarEstado(id, cuerpo, responsable) {
  const usuario = estado.usuarios.find((u) => u.id === id);
  if (!usuario) {
    return error(404, 'El usuario no existe');
  }
  const activo = Boolean(cuerpo?.activo);
  usuario.idEstado = activo ? 1 : 2;
  usuario.estado = activo ? 'Activo' : 'Bloqueado';

  registrarAuditoria({
    accion: activo ? 'ACTIVACION' : 'BLOQUEO',
    entidad: 'usuario',
    idEntidad: id,
    detalle: `Usuario ${usuario.usuario} ${activo ? 'activado' : 'bloqueado'}`,
    responsable: responsable?.usuario ?? 'sistema'
  });

  return ok(sinContrasena(usuario));
}

function manejarRestablecerContrasena(id, responsable) {
  const usuario = estado.usuarios.find((u) => u.id === id);
  if (!usuario) {
    return error(404, 'El usuario no existe');
  }

  registrarAuditoria({
    accion: 'RESTABLECIMIENTO_CONTRASENA',
    entidad: 'usuario',
    idEntidad: id,
    detalle: `Contrasena de ${usuario.usuario} restablecida a la identificacion`,
    responsable: responsable?.usuario ?? 'sistema'
  });

  return ok({ mensaje: 'Contrasena restablecida a la identificacion del usuario' });
}

function contarPorCurso(cursoId, rol, anioId) {
  return estado.matriculas.filter((m) => {
    if (m.cursoId !== cursoId) return false;
    const usuario = estado.usuarios.find((u) => u.id === m.usuarioId);
    return usuario?.rol === rol && anioId === estado.vigenciaActivaId;
  }).length;
}

function manejarListarCursos(query, usuarioActivo) {
  const vigencia = resolverVigencia(query);
  let filas = estado.cursos.map((curso) => ({
    id: curso.id,
    grado: curso.grado,
    estudiantes: contarPorCurso(curso.id, ROLES.ESTUDIANTE, vigencia.id),
    docentes: contarPorCurso(curso.id, ROLES.DOCENTE, vigencia.id) + contarPorCurso(curso.id, ROLES.COORDINADOR, vigencia.id)
  }));

  if (query.busqueda) {
    const patron = query.busqueda.toLowerCase();
    filas = filas.filter((c) => String(c.id).includes(patron) || c.grado.toLowerCase().includes(patron));
  }

  const asignadosDelUsuario = new Set(
    estado.matriculas.filter((m) => m.usuarioId === usuarioActivo?.id).map((m) => m.cursoId)
  );

  filas = filas.map((curso) => ({
    ...curso,
    administrable:
      usuarioActivo?.rol === ROLES.COORDINADOR
        ? true
        : usuarioActivo?.rol === ROLES.DOCENTE
          ? asignadosDelUsuario.has(curso.id)
          : false
  }));

  return ok(filas);
}

function manejarListarAsignaciones(query) {
  const vigencia = resolverVigencia(query);
  const filas = estado.matriculas
    .filter((m) => vigencia.id === estado.vigenciaActivaId)
    .map((m) => {
      const usuario = estado.usuarios.find((u) => u.id === m.usuarioId);
      const curso = estado.cursos.find((c) => c.id === m.cursoId);
      return usuario && curso && [ROLES.DOCENTE, ROLES.COORDINADOR].includes(usuario.rol)
        ? {
            cursoId: curso.id,
            grado: curso.grado,
            docenteId: usuario.id,
            docente: `${usuario.nombre} ${usuario.apellido}`,
            rol: usuario.rol
          }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.cursoId - b.cursoId);

  return ok(filas);
}

function manejarAsignarDocente(cuerpo, responsable) {
  const cursoId = Number(cuerpo?.cursoId);
  const docenteId = Number(cuerpo?.docenteId);
  const curso = estado.cursos.find((c) => c.id === cursoId);
  const docente = estado.usuarios.find((u) => u.id === docenteId);

  if (!curso) return error(404, 'El curso no existe');
  if (!docente || docente.idEstado !== 1 || ![ROLES.DOCENTE, ROLES.COORDINADOR].includes(docente.rol)) {
    return error(400, 'El docente no es valido');
  }
  if (estado.matriculas.some((m) => m.cursoId === cursoId && m.usuarioId === docenteId)) {
    return error(409, 'El docente ya esta asignado a este curso');
  }

  estado.matriculas.push({ cursoId, usuarioId: docenteId });

  registrarAuditoria({
    accion: 'ASIGNACION_CURSO',
    entidad: 'curso',
    idEntidad: cursoId,
    detalle: `${docente.usuario} asignado como tutor del curso ${cursoId}`,
    responsable: responsable?.usuario ?? 'sistema'
  });

  return creado({ cursoId, docenteId });
}

function manejarRetirarDocente(cursoId, docenteId, responsable) {
  const indice = estado.matriculas.findIndex((m) => m.cursoId === cursoId && m.usuarioId === docenteId);
  if (indice === -1) {
    return error(404, 'La asignacion no existe');
  }
  estado.matriculas.splice(indice, 1);

  registrarAuditoria({
    accion: 'RETIRO_CURSO',
    entidad: 'curso',
    idEntidad: cursoId,
    detalle: `Tutor retirado del curso ${cursoId}`,
    responsable: responsable?.usuario ?? 'sistema'
  });

  return { status: 204, cuerpo: null };
}

function manejarListarVigencias() {
  const filas = [...estado.vigencias]
    .sort((a, b) => b.id - a.id)
    .map((v) => ({ ...v, anio: v.id, activa: v.id === estado.vigenciaActivaId }));
  return ok(filas);
}

function manejarActivarVigencia(id, responsable) {
  const vigencia = estado.vigencias.find((v) => v.id === id);
  if (!vigencia) {
    return error(404, 'La vigencia no existe');
  }
  estado.vigenciaActivaId = id;

  registrarAuditoria({
    accion: 'ACTIVACION_VIGENCIA',
    entidad: 'vigencia',
    idEntidad: id,
    detalle: `Vigencia activa cambiada a ${id}`,
    responsable: responsable?.usuario ?? 'sistema'
  });

  return ok({ id, anio: id, activa: true });
}

function manejarListarAuditoria(query) {
  const limite = Number(query.limite ?? 50);
  const filas = [...estado.auditoria].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, limite);
  return ok(filas, { total: estado.auditoria.length, limite });
}

const ENCABEZADO_CSV = 'Año,idCurso,Usuario,Identificación,Apellidos,Nombres,E-Mail\n';

async function manejarCargaMasiva(formulario, query, responsable) {
  const archivo = formulario?.get?.('archivo');
  if (!archivo) {
    return error(400, 'Debe adjuntar el archivo CSV en el campo archivo');
  }

  const vigencia = resolverVigencia(query);
  const texto = await archivo.text();
  const lineas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((linea) => linea.trim().length > 0);
  const filas = lineas.slice(1);

  if (filas.length === 0) {
    return error(422, 'El archivo tiene errores y no se procesa de forma parcial', {
      errores: [{ fila: 1, mensajes: ['El archivo no tiene filas de datos'] }]
    });
  }

  const errores = [];
  const registros = [];

  filas.forEach((linea, indice) => {
    const columnas = linea.split(',').map((valor) => valor.trim());
    const numeroFila = indice + 2;
    const mensajes = [];

    if (columnas.length < 7) {
      mensajes.push('La fila no tiene las 7 columnas esperadas');
    } else {
      const [anio, idCurso, usuario, identificacion, apellidos, nombres, correo] = columnas;
      if (String(anio) !== String(vigencia.id)) {
        mensajes.push(`El año ${anio} no coincide con la vigencia ${vigencia.id}`);
      }
      if (!/^\d{6,20}$/.test(identificacion ?? '')) {
        mensajes.push('La identificacion debe tener entre 6 y 20 digitos');
      }
      if (!correo || !correo.includes('@')) {
        mensajes.push('El correo no es valido');
      }
      if (!mensajes.length) {
        registros.push({ idCurso: Number(idCurso), usuario, identificacion, apellidos, nombres, correo });
      }
    }

    if (mensajes.length) {
      errores.push({ fila: numeroFila, mensajes });
    }
  });

  if (errores.length) {
    registrarAuditoria({
      accion: 'CARGA_MASIVA_RECHAZADA',
      entidad: 'usuario',
      idEntidad: null,
      detalle: `Archivo ${archivo.name} rechazado con ${errores.length} filas con error`,
      responsable: responsable?.usuario ?? 'sistema'
    });
    return error(422, 'El archivo tiene errores y no se procesa de forma parcial', { errores });
  }

  registros.forEach((fila) => {
    const nuevo = {
      id: nuevoIdUsuario(),
      identificacion: fila.identificacion,
      usuario: fila.usuario,
      nombre: fila.nombres,
      apellido: fila.apellidos,
      email: fila.correo,
      idEstado: 1,
      estado: 'Activo',
      rol: ROLES.ESTUDIANTE
    };
    estado.usuarios.push(nuevo);
    estado.matriculas.push({ cursoId: fila.idCurso, usuarioId: nuevo.id });
  });

  registrarAuditoria({
    accion: 'CARGA_MASIVA_ACEPTADA',
    entidad: 'usuario',
    idEntidad: null,
    detalle: `Archivo ${archivo.name} con ${registros.length} estudiantes cargados en la vigencia ${vigencia.id}`,
    responsable: responsable?.usuario ?? 'sistema'
  });

  return ok({ archivo: archivo.name, anio: vigencia.id, creados: registros.length });
}

export async function manejarSolicitud({ metodo, ruta, query = {}, cuerpo, formulario, token }) {
  await esperar();

  const responsable = usuarioActual(token);
  const segmentos = ruta.split('/').filter(Boolean);

  if (ruta === '/auth/login' && metodo === 'POST') return manejarLogin(cuerpo);
  if (ruta === '/auth/perfil' && metodo === 'GET') return manejarPerfil(token);
  if (ruta === '/auth/cerrar-sesion' && metodo === 'POST') {
    if (responsable) {
      registrarAuditoria({
        accion: 'CIERRE_SESION',
        entidad: 'usuario',
        idEntidad: responsable.id,
        detalle: `Cierre de sesion de ${responsable.usuario}`,
        responsable: responsable.usuario
      });
    }
    return ok({ mensaje: 'Sesion cerrada' });
  }
  if (ruta === '/auth/contrasena' && metodo === 'POST') return ok({ mensaje: 'Contrasena actualizada' });

  if (!responsable) {
    return error(401, 'Sesion invalida');
  }

  if (ruta === '/usuarios' && metodo === 'GET') return manejarListarUsuarios(query);
  if (ruta === '/usuarios' && metodo === 'POST') return manejarCrearUsuario(cuerpo, responsable);
  if (segmentos[0] === 'usuarios' && segmentos[2] === 'estado' && metodo === 'PATCH') {
    return manejarCambiarEstado(Number(segmentos[1]), cuerpo, responsable);
  }
  if (segmentos[0] === 'usuarios' && segmentos[2] === 'contrasena' && metodo === 'POST') {
    return manejarRestablecerContrasena(Number(segmentos[1]), responsable);
  }
  if (segmentos[0] === 'usuarios' && segmentos.length === 2 && metodo === 'PATCH') {
    return manejarActualizarUsuario(Number(segmentos[1]), cuerpo, responsable);
  }

  if (ruta === '/cursos' && metodo === 'GET') return manejarListarCursos(query, responsable);

  if (ruta === '/asignaciones' && metodo === 'GET') return manejarListarAsignaciones(query);
  if (ruta === '/asignaciones' && metodo === 'POST') return manejarAsignarDocente(cuerpo, responsable);
  if (segmentos[0] === 'asignaciones' && segmentos.length === 3 && metodo === 'DELETE') {
    return manejarRetirarDocente(Number(segmentos[1]), Number(segmentos[2]), responsable);
  }

  if (ruta === '/vigencias' && metodo === 'GET') return manejarListarVigencias();
  if (segmentos[0] === 'vigencias' && segmentos[2] === 'activar' && metodo === 'PATCH') {
    return manejarActivarVigencia(Number(segmentos[1]), responsable);
  }

  if (ruta === '/auditoria' && metodo === 'GET') return manejarListarAuditoria(query);

  if (ruta === '/cargas/usuarios' && metodo === 'POST') return manejarCargaMasiva(formulario, query, responsable);

  return error(404, 'Recurso no encontrado en el modo demo');
}

export function generarPlantillaCsv() {
  return new Blob([`﻿${ENCABEZADO_CSV}`], { type: 'text/csv;charset=utf-8' });
}

export function generarPlantillaEjemploCsv(anio) {
  const anioMostrado = anio ?? new Date().getFullYear();
  const filaEjemplo = [
    anioMostrado,
    111,
    'juan.perez',
    1000000001,
    'Perez Gomez',
    'Juan Camilo',
    'juan.perez@iedlavictoria.edu.co'
  ].join(',');
  return new Blob([`﻿${ENCABEZADO_CSV}${filaEjemplo}\n`], { type: 'text/csv;charset=utf-8' });
}
