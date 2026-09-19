import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { asignarDocente, listarDocentesDisponibles, retirarDocente } from '../api/asignaciones.js';
import { obtenerCurso } from '../api/cursos.js';
import { useAuth } from '../hooks/useAuth.js';
import { ROLES } from '../shared/roles.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';
import SelectorVigencia from '../components/SelectorVigencia.jsx';
import { IconoBuscar, IconoCursos, IconoUsuarios } from '../components/Iconos.jsx';

function iniciales(nombre = '', apellido = '') {
  return `${nombre.trim().charAt(0)}${apellido.trim().charAt(0)}`.toUpperCase() || '?';
}

export default function DetalleCurso() {
  const { id } = useParams();
  const [parametros] = useSearchParams();
  const { vigencia, rolesEfectivos } = useAuth();

  const anioInicial = Number(parametros.get('anio')) || null;
  const [anioConsultado, setAnioConsultado] = useState(anioInicial);
  const anioMostrado = anioConsultado ?? vigencia?.id;
  const esVigenciaActiva = anioMostrado === vigencia?.id;
  const puedeAsignar = rolesEfectivos.includes(ROLES.COORDINADOR) && esVigenciaActiva;

  const [curso, setCurso] = useState(null);
  const [docentesDisponibles, setDocentesDisponibles] = useState([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');

  const consultar = useCallback(async () => {
    if (!anioMostrado) return;
    setCargando(true);
    setError(null);

    try {
      const peticiones = [obtenerCurso(id, { anio: anioMostrado })];
      if (puedeAsignar) {
        peticiones.push(listarDocentesDisponibles());
      }

      const [respuestaCurso, respuestaDocentes] = await Promise.all(peticiones);
      setCurso(respuestaCurso.data);
      setDocentesDisponibles(respuestaDocentes ? respuestaDocentes.data : []);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }, [id, anioMostrado, puedeAsignar]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  const disponiblesParaAsignar = useMemo(() => {
    if (!curso) return docentesDisponibles;
    const yaAsignados = new Set(curso.docentes.map((docente) => docente.id));
    return docentesDisponibles.filter((docente) => !yaAsignados.has(docente.id));
  }, [docentesDisponibles, curso]);

  const estudiantesVisibles = useMemo(() => {
    if (!curso) return [];
    const patron = busquedaEstudiante.trim().toLowerCase();
    if (!patron) return curso.estudiantes;
    return curso.estudiantes.filter((persona) =>
      [persona.nombre, persona.apellido, persona.identificacion, persona.email].some((valor) =>
        String(valor ?? '').toLowerCase().includes(patron)
      )
    );
  }, [curso, busquedaEstudiante]);

  const asignar = async (evento) => {
    evento.preventDefault();
    setMensaje(null);
    setError(null);
    setGuardando(true);

    try {
      await asignarDocente({ cursoId: Number(id), docenteId: Number(docenteSeleccionado) }, vigencia?.id);
      setDocenteSeleccionado('');
      setMensaje('Docente asignado como tutor de este curso');
      await consultar();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  };

  const retirar = async (docenteId) => {
    setMensaje(null);
    setError(null);

    try {
      await retirarDocente(id, docenteId, vigencia?.id);
      setMensaje('Docente retirado de este curso');
      await consultar();
    } catch (fallo) {
      setError(fallo.message);
    }
  };

  return (
    <section className="seccion">
      <div className="seccion__migas">Gestion curricular · IED La Victoria</div>
      <div className="seccion__encabezado">
        <div>
          <Link to="/cursos" className="boton boton--fantasma boton--sm" style={{ marginBottom: 'var(--space-3)' }}>
            ← Volver a cursos
          </Link>
          <h1>{curso ? curso.grado : 'Curso'}</h1>
          <p className="seccion__subtitulo">
            {curso
              ? `Curso ${curso.id}, vigencia ${anioMostrado}. Tutores y estudiantes enlazados a este curso en esa vigencia.`
              : 'Consultando informacion del curso...'}
            {curso && !esVigenciaActiva && ' Esta viendo un año anterior, en modo solo consulta.'}
          </p>
        </div>
        <div className="seccion__acciones">
          <SelectorVigencia valor={anioMostrado} alCambiar={setAnioConsultado} />
        </div>
      </div>

      <Aviso tipo="error">{error}</Aviso>
      <Aviso tipo="exito">{mensaje}</Aviso>

      {cargando ? (
        <Cargando mensaje="Consultando el curso" />
      ) : !curso ? null : (
        <div className="rejilla-accesos" style={{ gridTemplateColumns: '1fr' }}>
          <div className="tarjeta" style={{ gap: 'var(--space-3)' }}>
            <div className="seccion__encabezado" style={{ marginBottom: 0 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <IconoUsuarios width={18} height={18} />
                Docentes tutores
              </h2>
              <span className="insignia insignia--activo">{curso.docentes.length}</span>
            </div>

            {curso.docentes.length === 0 ? (
              <p className="celda-identidad__detalle">Este curso no tiene docentes enlazados en esta vigencia.</p>
            ) : (
              <div className="tabla-envoltorio">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Nombre y documento</th>
                      <th>Correo institucional</th>
                      {puedeAsignar && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {curso.docentes.map((persona) => (
                      <tr key={persona.id}>
                        <td data-etiqueta="Nombre y documento">
                          <div className="celda-identidad">
                            <span className="avatar">{iniciales(persona.nombre, persona.apellido)}</span>
                            <div>
                              <div className="celda-identidad__nombre">{`${persona.nombre} ${persona.apellido}`}</div>
                              <div className="celda-identidad__detalle">{persona.identificacion}</div>
                            </div>
                          </div>
                        </td>
                        <td data-etiqueta="Correo">{persona.email}</td>
                        {puedeAsignar && (
                          <td data-etiqueta="Acciones">
                            <button
                              type="button"
                              className="boton boton--enlace boton--peligro-texto"
                              onClick={() => retirar(persona.id)}
                            >
                              Retirar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {puedeAsignar && (
              disponiblesParaAsignar.length === 0 ? (
                <p className="celda-identidad__detalle" style={{ marginTop: 'var(--space-2)' }}>
                  Todos los docentes activos ya estan asignados como tutores de este curso, no hay nadie mas
                  para agregar.
                </p>
              ) : (
                <form className="barra-filtros" onSubmit={asignar} style={{ marginTop: 'var(--space-2)' }}>
                  <select
                    value={docenteSeleccionado}
                    onChange={(evento) => setDocenteSeleccionado(evento.target.value)}
                    required
                  >
                    <option value="">Seleccione un docente...</option>
                    {disponiblesParaAsignar.map((docente) => (
                      <option key={docente.id} value={docente.id}>
                        {docente.nombre} {docente.apellido}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="boton" disabled={guardando || !docenteSeleccionado}>
                    {guardando ? 'Asignando...' : 'Asignar docente'}
                  </button>
                </form>
              )
            )}
          </div>

          <div className="tarjeta" style={{ gap: 'var(--space-3)' }}>
            <div className="seccion__encabezado" style={{ marginBottom: 0 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <IconoCursos width={18} height={18} />
                Estudiantes
              </h2>
              <span className="insignia insignia--activo">{curso.estudiantes.length}</span>
            </div>

            {curso.estudiantes.length > 0 && (
              <div className="campo-busqueda">
                <IconoBuscar />
                <input
                  type="search"
                  placeholder="Buscar por documento, nombre o correo..."
                  value={busquedaEstudiante}
                  onChange={(evento) => setBusquedaEstudiante(evento.target.value)}
                />
              </div>
            )}

            {curso.estudiantes.length === 0 ? (
              <p className="celda-identidad__detalle">Este curso no tiene estudiantes enlazados en esta vigencia.</p>
            ) : estudiantesVisibles.length === 0 ? (
              <p className="celda-identidad__detalle">Ningun estudiante coincide con esa busqueda.</p>
            ) : (
              <div className="tabla-envoltorio">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Nombre y documento</th>
                      <th>Correo institucional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantesVisibles.map((persona) => (
                      <tr key={persona.id}>
                        <td data-etiqueta="Nombre y documento">
                          <div className="celda-identidad">
                            <span className="avatar">{iniciales(persona.nombre, persona.apellido)}</span>
                            <div>
                              <div className="celda-identidad__nombre">{`${persona.nombre} ${persona.apellido}`}</div>
                              <div className="celda-identidad__detalle">{persona.identificacion}</div>
                            </div>
                          </div>
                        </td>
                        <td data-etiqueta="Correo">{persona.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
