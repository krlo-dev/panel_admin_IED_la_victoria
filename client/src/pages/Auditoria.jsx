import { useEffect, useState } from 'react';
import { listarAuditoria } from '../api/auditoria.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';
import { IconoAuditoria } from '../components/Iconos.jsx';

function formatearFecha(valor) {
  if (!valor) return '';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(valor));
  } catch {
    return valor;
  }
}

export default function Auditoria() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vigente = true;

    listarAuditoria({ limite: 50 })
      .then((respuesta) => vigente && setRegistros(respuesta.data))
      .catch((fallo) => vigente && setError(fallo.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, []);

  return (
    <section className="seccion">
      <div className="seccion__migas">Trazabilidad institucional</div>
      <div className="seccion__encabezado">
        <div>
          <h1>Registro de auditoria</h1>
          <p className="seccion__subtitulo">
            Consulte quien realizo cada cambio sobre los usuarios, en que consistio y cuando ocurrio.
          </p>
        </div>
      </div>

      <Aviso tipo="error">{error}</Aviso>

      {cargando ? (
        <Cargando mensaje="Consultando auditoria" />
      ) : (
        <div className="tabla-envoltorio">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Responsable</th>
                <th>Accion</th>
                <th>Entidad</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id}>
                  <td data-etiqueta="Fecha">{formatearFecha(registro.fecha)}</td>
                  <td data-etiqueta="Responsable">{registro.responsable}</td>
                  <td data-etiqueta="Accion">
                    <span className="insignia insignia--coordinador">{registro.accion}</span>
                  </td>
                  <td data-etiqueta="Entidad">{`${registro.entidad} ${registro.idEntidad ?? ''}`.trim()}</td>
                  <td data-etiqueta="Detalle">{registro.detalle}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {registros.length === 0 && (
            <div className="estado-vacio">
              <span className="estado-vacio__icono">
                <IconoAuditoria width={22} height={22} />
              </span>
              <p>Aun no hay registros de auditoria.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
