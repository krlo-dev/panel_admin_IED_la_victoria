import { useCallback, useEffect, useState } from 'react';
import { activarVigencia, listarVigencias } from '../api/vigencias.js';
import { ROLES } from '../shared/roles.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';
import PermisoRol from '../components/PermisoRol.jsx';

export default function Vigencias() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const consultar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await listarVigencias();
      setRegistros(respuesta.data);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    consultar();
  }, [consultar]);

  const activar = async (id) => {
    setError(null);
    try {
      await activarVigencia(id);
      await consultar();
    } catch (fallo) {
      setError(fallo.message);
    }
  };

  if (cargando) {
    return <Cargando mensaje="Consultando vigencias" />;
  }

  return (
    <section className="seccion">
      <h1>Vigencias</h1>
      <Aviso tipo="error">{error}</Aviso>

      <table className="tabla">
        <thead>
          <tr>
            <th>Ano lectivo</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Estado</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {registros.map((vigencia) => (
            <tr key={vigencia.id}>
              <td>{vigencia.anio}</td>
              <td>{vigencia.fechaInicio}</td>
              <td>{vigencia.fechaFin}</td>
              <td>{vigencia.activa ? 'Activa' : 'Historica'}</td>
              <td>
                {!vigencia.activa && (
                  <PermisoRol roles={[ROLES.COORDINADOR]}>
                    <button type="button" className="boton boton--claro" onClick={() => activar(vigencia.id)}>
                      Activar
                    </button>
                  </PermisoRol>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
