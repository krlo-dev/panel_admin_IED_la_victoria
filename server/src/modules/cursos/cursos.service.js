import { HttpError } from '../../shared/httpError.js';
import { ROLES } from '../../shared/roles.js';
import * as repository from './cursos.repository.js';

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

  return { ...curso, administrable };
}

export async function mios({ usuario, vigenciaId }) {
  return repository.cursosDelUsuario(usuario.id, vigenciaId);
}
