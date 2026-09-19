import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { crearCurso, eliminarCurso, listarCursos } from '../api/cursos.js';
import { useAuth } from '../hooks/useAuth.js';
import { ROLES } from '../shared/roles.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';
import Modal from '../components/Modal.jsx';
import SelectorVigencia from '../components/SelectorVigencia.jsx';
import { IconoBuscar, IconoCursos } from '../components/Iconos.jsx';

const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F'];
const CURSO_VACIO = { grado: '', seccion: 'A' };

export default function Cursos() {
  const { vigencia, rolesEfectivos } = useAuth();
  const puedeCrear = rolesEfectivos.includes(ROLES.ADMINISTRADOR);

  const [registros, setRegistros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [anioConsultado, setAnioConsultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [modal, setModal] = useState(false);
  const [nuevo, setNuevo] = useState(CURSO_VACIO);
  const [creando, setCreando] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);

  const anioMostrado = anioConsultado ?? vigencia?.id;
  const esVigenciaActiva = anioMostrado === vigencia?.id;

  const consultar = useCallback(() => {
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

  useEffect(() => consultar(), [consultar]);

  const idCalculado = nuevo.grado ? Number(nuevo.grado) * 100 + 11 + SECCIONES.indexOf(nuevo.seccion) : null;
  const etiquetaCalculada = nuevo.grado ? `${nuevo.grado}${nuevo.seccion}` : '';

  const crear = async (evento) => {
    evento.preventDefault();
    setErrorModal(null);
    setCreando(true);

    try {
      await crearCurso({ grado: Number(nuevo.grado), seccion: nuevo.seccion });
      setModal(false);
      setNuevo(CURSO_VACIO);
      setMensaje(`Curso ${etiquetaCalculada} creado correctamente`);
      consultar();
    } catch (fallo) {
      setErrorModal(fallo.message);
    } finally {
      setCreando(false);
    }
  };

  const eliminar = async (evento, curso) => {
    evento.preventDefault();
    evento.stopPropagation();
    setError(null);
    setMensaje(null);
    setEliminandoId(curso.id);

    try {
      await eliminarCurso(curso.id);
      setMensaje(`Curso ${curso.grado} eliminado correctamente`);
      consultar();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setEliminandoId(null);
    }
  };

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
        {puedeCrear && (
          <div className="seccion__acciones">
            <button type="button" className="boton" onClick={() => setModal(true)}>
              + Crear curso
            </button>
          </div>
        )}
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
      <Aviso tipo="exito">{mensaje}</Aviso>

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
            <Link
              key={curso.id}
              to={`/cursos/${curso.id}${anioMostrado ? `?anio=${anioMostrado}` : ''}`}
              className="tarjeta tarjeta--clic"
            >
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
              {puedeCrear && curso.estudiantes === 0 && curso.docentes === 0 && (
                <button
                  type="button"
                  className="boton boton--fantasma"
                  style={{ marginTop: 'var(--space-2)', alignSelf: 'flex-start' }}
                  disabled={eliminandoId === curso.id}
                  onClick={(evento) => eliminar(evento, curso)}
                >
                  {eliminandoId === curso.id ? 'Eliminando...' : 'Eliminar curso'}
                </button>
              )}
            </Link>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          titulo="Crear curso"
          subtitulo="El curso queda disponible para todas las vigencias"
          onCerrar={() => setModal(false)}
        >
          <form onSubmit={crear}>
            <div className="rejilla-campos">
              <div className="campo">
                <label htmlFor="grado">Grado (1 a 11)</label>
                <input
                  id="grado"
                  type="number"
                  min="1"
                  max="11"
                  value={nuevo.grado}
                  onChange={(evento) => setNuevo((previo) => ({ ...previo, grado: evento.target.value }))}
                  required
                />
              </div>

              <div className="campo">
                <label htmlFor="seccion">Seccion</label>
                <select
                  id="seccion"
                  value={nuevo.seccion}
                  onChange={(evento) => setNuevo((previo) => ({ ...previo, seccion: evento.target.value }))}
                >
                  {SECCIONES.map((letra) => (
                    <option key={letra} value={letra}>
                      {letra}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {nuevo.grado && (
              <div className="aviso aviso--info" style={{ marginTop: 'var(--space-2)' }}>
                {`Se creara como curso ${etiquetaCalculada}, con id ${idCalculado} (mismo patron del script del profesor: grado x 100 + 11 para la seccion A, +12 para B, y asi sucesivamente).`}
              </div>
            )}

            <Aviso tipo="error">{errorModal}</Aviso>

            <div className="modal__pie">
              <button type="button" className="boton boton--fantasma" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="boton" disabled={creando}>
                {creando ? 'Creando...' : 'Crear curso'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
