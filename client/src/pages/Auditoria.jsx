import { useEffect, useState } from 'react';
import { listarAuditoria } from '../api/auditoria.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';

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

  if (cargando) {
    return <Cargando mensaje="Consultando auditoria" />;
  }

  return (
    <section className="seccion">
      <h1>Auditoria</h1>
      <Aviso tipo="error">{error}</Aviso>

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
              <td>{registro.fecha}</td>
              <td>{registro.responsable}</td>
              <td>{registro.accion}</td>
              <td>{`${registro.entidad} ${registro.idEntidad ?? ''}`.trim()}</td>
              <td>{registro.detalle}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
