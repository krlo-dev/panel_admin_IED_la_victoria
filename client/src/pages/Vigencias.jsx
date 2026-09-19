import { useCallback, useEffect, useState } from 'react';
import { activarVigencia, listarVigencias } from '../api/vigencias.js';
import { ROLES } from '../shared/roles.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';
import PermisoRol from '../components/PermisoRol.jsx';
import { IconoVigencias } from '../components/Iconos.jsx';

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

  const activa = registros.find((vigencia) => vigencia.activa);
  const historicas = registros.filter((vigencia) => !vigencia.activa);

  return (
    <section className="seccion">
      <div className="seccion__migas">Gestion curricular · Vigencias academicas</div>
      <div className="seccion__encabezado">
        <div>
          <h1>Vigencias por año lectivo</h1>
          <p className="seccion__subtitulo">
            Los registros de vigencias anteriores no se eliminan; permanecen disponibles para consulta (RN05).
          </p>
        </div>
      </div>

      <Aviso tipo="error">{error}</Aviso>

      {cargando ? (
        <Cargando mensaje="Consultando vigencias" />
      ) : (
        <>
          {activa && (
            <div className="tarjeta tarjeta--sombra" style={{ marginBottom: 'var(--space-5)', maxWidth: 560 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span className="estadistica__icono">
                  <IconoVigencias width={18} height={18} />
                </span>
                <span className="insignia insignia--activo">Vigencia activa</span>
              </div>
              <h2>{`Periodo ${activa.anio}`}</h2>
              <p className="celda-identidad__detalle">
                {`Apertura ${activa.fechaInicio} · Cierre estipulado ${activa.fechaFin}`}
              </p>
            </div>
          )}

          {historicas.length > 0 && (
            <>
              <h2 style={{ marginBottom: 'var(--space-3)' }}>Expedientes historicos</h2>
              <div className="rejilla-accesos">
                {historicas.map((vigencia) => (
                  <div key={vigencia.id} className="tarjeta">
                    <div className="seccion__encabezado" style={{ marginBottom: 0 }}>
                      <h2 style={{ fontSize: '1.05rem' }}>{`Vigencia ${vigencia.anio}`}</h2>
                      <span className="insignia insignia--inactivo">Historica</span>
                    </div>
                    <p className="celda-identidad__detalle">{`${vigencia.fechaInicio} a ${vigencia.fechaFin}`}</p>
                    <PermisoRol roles={[ROLES.COORDINADOR]}>
                      <button type="button" className="boton boton--claro boton--sm" onClick={() => activar(vigencia.id)}>
                        Activar esta vigencia
                      </button>
                    </PermisoRol>
                  </div>
                ))}
              </div>
            </>
          )}

          {registros.length === 0 && (
            <div className="tarjeta estado-vacio">
              <span className="estado-vacio__icono">
                <IconoVigencias width={22} height={22} />
              </span>
              <p>No hay vigencias registradas.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
