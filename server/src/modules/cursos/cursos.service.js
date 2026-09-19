import { HttpError } from '../../shared/httpError.js';
import { ROLES } from '../../shared/roles.js';
import { registrar } from '../auditoria/auditoria.service.js';
import * as repository from './cursos.repository.js';

// Mismo patron que ya trae el script del profesor (ver database/script.sql):
// id = grado*100 + 11 para la seccion A, +12 para B, y asi sucesivamente.
const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F'];

export async function listar({ vigenciaId, busqueda, usuario }) {
  const cursos = await repository.listar({ vigenciaId, busqueda });

  if (usuario.rol !== ROLES.DOCENTE) {
    return cursos.map((curso) => ({ ...curso, administrable: usuario.rol === ROLES.COORDINADOR }));
  }

  const asignados = new Set((await repository.cursosDelUsuario(usuario.id, vigenciaId)).map((c) => c.id));
  return cursos.map((curso) => ({ ...curso, administrable: asignados.has(curso.id) }));
}

export async function obtener({ id, vigenciaId, usuario }) {
  const curso = await repository.buscarPorId(id);
  if (!curso) {
    throw HttpError.notFound('El curso no existe');
  }

  const administrable =
    usuario.rol === ROLES.COORDINADOR || (await repository.estaAsignado(id, usuario.id, vigenciaId));

  const integrantes = await repository.integrantes(id, vigenciaId);
  const docentes = integrantes.filter((persona) => persona.rol === ROLES.DOCENTE);
  const estudiantes = integrantes.filter((persona) => persona.rol === ROLES.ESTUDIANTE);

  return { ...curso, administrable, docentes, estudiantes };
}

export async function crear({ grado, seccion, responsable }) {
  const indice = SECCIONES.indexOf(seccion);
  const id = grado * 100 + 11 + indice;
  const etiqueta = `${grado}${seccion}`;

  const existente = await repository.buscarPorId(id);
  if (existente) {
    throw HttpError.conflict(`Ya existe el curso ${existente.grado} con esa combinacion de grado y seccion`);
  }

  await repository.crear({ id, grado: etiqueta });

  await registrar({
    responsable,
    accion: 'CREACION_CURSO',
    entidad: 'curso',
    entidadId: id,
    detalle: `Creacion del curso ${etiqueta} (id ${id})`
  });

  return { id, grado: etiqueta };
}

export async function eliminar({ id, responsable }) {
  const curso = await repository.buscarPorId(id);
  if (!curso) {
    throw HttpError.notFound('El curso no existe');
  }

  const tieneMatriculas = await repository.tieneMatriculas(id);
  if (tieneMatriculas) {
    throw HttpError.conflict(
      `El curso ${curso.grado} tiene estudiantes o docentes matriculados (en alguna vigencia) y no se puede eliminar`
    );
  }

  await repository.eliminar(id);

  await registrar({
    responsable,
    accion: 'ELIMINACION_CURSO',
    entidad: 'curso',
    entidadId: id,
    detalle: `Eliminacion del curso ${curso.grado} (id ${id}), sin matriculas`
  });
}

export async function mios({ usuario, vigenciaId }) {
  return repository.cursosDelUsuario(usuario.id, vigenciaId);
}
