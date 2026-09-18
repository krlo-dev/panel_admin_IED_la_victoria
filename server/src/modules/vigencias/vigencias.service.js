import { pool, query, queryOne, withTransaction } from '../../config/db.js';
import { HttpError } from '../../shared/httpError.js';
import { vigenciaActiva } from '../../middlewares/vigenciaActiva.js';
import { registrar } from '../auditoria/auditoria.service.js';

const CLAVE_ACTIVA = 'vigencia_activa';

export async function listar() {
  const activa = await vigenciaActiva();
  const registros = await query(
    'SELECT id, fecha_inicio AS fechaInicio, fecha_fin AS fechaFin FROM vigencia ORDER BY id DESC'
  );

  return registros.map((vigencia) => ({
    ...vigencia,
    anio: vigencia.id,
    activa: vigencia.id === activa?.id
  }));
}

export async function crear({ datos, responsable }) {
  const existente = await queryOne('SELECT id FROM vigencia WHERE id = ? LIMIT 1', [datos.anio]);
  if (existente) {
    throw HttpError.conflict('La vigencia ya existe');
  }

  if (datos.fechaFin < datos.fechaInicio) {
    throw HttpError.badRequest('La fecha final no puede ser anterior a la inicial');
  }

  await pool.execute('INSERT INTO vigencia (id, fecha_inicio, fecha_fin) VALUES (?, ?, ?)', [
    datos.anio,
    datos.fechaInicio,
    datos.fechaFin
  ]);

  await registrar({
    responsable,
    accion: 'CREACION',
    entidad: 'vigencia',
    entidadId: datos.anio,
    detalle: `Vigencia ${datos.anio} creada`
  });

  return { id: datos.anio, anio: datos.anio, activa: false };
}

export async function activar({ id, responsable }) {
  const vigencia = await queryOne('SELECT id FROM vigencia WHERE id = ? LIMIT 1', [id]);
  if (!vigencia) {
    throw HttpError.notFound('La vigencia no existe');
  }

  await withTransaction(async (connection) => {
    const [resultado] = await connection.execute('UPDATE configuracion SET valor = ? WHERE clave = ?', [
      String(id),
      CLAVE_ACTIVA
    ]);

    if (!resultado.affectedRows) {
      throw HttpError.unprocessable(`No existe el parametro ${CLAVE_ACTIVA} en la tabla configuracion`);
    }

    await registrar(
      {
        responsable,
        accion: 'ACTIVACION_VIGENCIA',
        entidad: 'vigencia',
        entidadId: id,
        detalle: `Vigencia activa cambiada a ${id}`
      },
      connection
    );
  });

  return { id, anio: id, activa: true };
}
