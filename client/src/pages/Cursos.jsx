import { useEffect, useMemo, useState } from 'react';
import { listarCursos } from '../api/cursos.js';
import { useAuth } from '../hooks/useAuth.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';
import SelectorVigencia from '../components/SelectorVigencia.jsx';
import { IconoBuscar, IconoCursos } from '../components/Iconos.jsx';

export default function Cursos() {
  const { vigencia } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [anioConsultado, setAnioConsultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const anioMostrado = anioConsultado ?? vigencia?.id;
  const esVigenciaActiva = anioMostrado === vigencia?.id;

  useEffect(() => {
    let vigente = true;
    setCargando(true);

    listarCursos({ anio: anioMostrado })
      .then((respuesta) => vigente && setRegistros(respuesta.data))
      .catch((fallo) => vigente && setError(fallo.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [anioMostrado]);

  const visibles = useMemo(() => {
    const patron = busqueda.trim().toLowerCase();
    if (!patron) {
      return registros;
    }
    return registros.filter((curso) =>
      [curso.id, curso.grado].some((valor) => String(valor ?? '').toLowerCase().includes(patron))
    );
  }, [registros, busqueda]);

  return (
    <section className="seccion">
      <div className="seccion__migas">Gestion curricular · IED La Victoria</div>
      <div className="seccion__encabezado">
        <div>
          <h1>Cursos institucionales</h1>
          <p className="seccion__subtitulo">
            {anioMostrado
              ? `Cursos habilitados durante la vigencia ${anioMostrado}, con la cantidad de estudiantes y docentes enlazados a cada uno.`
              : 'Consulte los cursos de la institucion agrupados por vigencia academica.'}
            {!esVigenciaActiva && ' Esta viendo un año anterior, en modo solo consulta.'}
          </p>
        </div>
      </div>

      <div className="barra-filtros">
        <div className="campo-busqueda">
          <IconoBuscar />
          <input
            type="search"
            placeholder="Buscar por codigo o grado..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
        </div>
        <SelectorVigencia valor={anioMostrado} alCambiar={setAnioConsultado} />
      </div>

      <Aviso tipo="error">{error}</Aviso>

      {cargando ? (
        <Cargando mensaje="Consultando cursos" />
      ) : visibles.length === 0 ? (
        <div className="tarjeta estado-vacio">
          <span className="estado-vacio__icono">
            <IconoCursos width={22} height={22} />
          </span>
          <p>No hay cursos para mostrar con este filtro.</p>
        </div>
      ) : (
        <div className="rejilla-accesos">
          {visibles.map((curso) => (
            <div key={curso.id} className="tarjeta">
              <div className="seccion__encabezado" style={{ marginBottom: 0 }}>
                <div>
                  <span className="celda-identidad__detalle">{curso.id}</span>
                  <h2 style={{ marginTop: 2 }}>{curso.grado}</h2>
                </div>
                <span className={`insignia ${curso.administrable ? 'insignia--activo' : 'insignia--inactivo'}`}>
                  {curso.administrable ? 'Administra' : 'Solo consulta'}
                </span>
              </div>
              <p className="celda-identidad__detalle">
                {curso.estudiantes} estudiantes · {curso.docentes} docentes
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
