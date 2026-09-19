import { useCallback, useEffect, useState } from 'react';
import { activarVigencia, crearVigencia, listarVigencias } from '../api/vigencias.js';
import { useAuth } from '../hooks/useAuth.js';
import { ROLES } from '../shared/roles.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';
import PermisoRol from '../components/PermisoRol.jsx';
import { IconoVigencias } from '../components/Iconos.jsx';

const VIGENCIA_VACIA = { anio: '', fechaInicio: '', fechaFin: '' };

export default function Vigencias() {
  const { refrescarSesion } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [nueva, setNueva] = useState(VIGENCIA_VACIA);
  const [creando, setCreando] = useState(false);

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
    setMensaje(null);
    try {
      await activarVigencia(id);
      await Promise.all([consultar(), refrescarSesion()]);
      setMensaje('Vigencia activa actualizada. El resto de las pantallas ya reflejan el nuevo año por defecto.');
    } catch (fallo) {
      setError(fallo.message);
    }
  };

  const crear = async (evento) => {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setCreando(true);

    try {
      await crearVigencia({
        anio: Number(nueva.anio),
        fechaInicio: nueva.fechaInicio,
        fechaFin: nueva.fechaFin
      });
      setNueva(VIGENCIA_VACIA);
      setMensaje('Vigencia creada. Activala cuando quieras que sea la vigencia por defecto.');
      await consultar();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCreando(false);
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
            Los registros de años anteriores no se eliminan nunca, quedan disponibles para consultarlos cuando los necesite.
          </p>
        </div>
      </div>

      <Aviso tipo="error">{error}</Aviso>
      <Aviso tipo="exito">{mensaje}</Aviso>

      <PermisoRol roles={[ROLES.COORDINADOR]}>
        <form
          className="tarjeta tarjeta--sombra"
          onSubmit={crear}
          style={{ marginBottom: 'var(--space-5)', maxWidth: 560 }}
        >
          <h2>Nueva vigencia</h2>
          <div className="rejilla-campos">
            <div className="campo">
              <label htmlFor="anio">Año lectivo</label>
              <input
                id="anio"
                type="number"
                min="2000"
                max="2100"
                value={nueva.anio}
                onChange={(evento) => setNueva((previo) => ({ ...previo, anio: evento.target.value }))}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="fechaInicio">Apertura</label>
              <input
                id="fechaInicio"
                type="date"
                value={nueva.fechaInicio}
                onChange={(evento) => setNueva((previo) => ({ ...previo, fechaInicio: evento.target.value }))}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="fechaFin">Cierre estipulado</label>
              <input
                id="fechaFin"
                type="date"
                value={nueva.fechaFin}
                onChange={(evento) => setNueva((previo) => ({ ...previo, fechaFin: evento.target.value }))}
                required
              />
            </div>
          </div>

          <button type="submit" className="boton" disabled={creando}>
            {creando ? 'Creando...' : 'Crear vigencia'}
          </button>
        </form>
      </PermisoRol>

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
