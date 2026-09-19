import { useCallback, useEffect, useState } from 'react';
import { asignarDocente, listarAsignaciones, retirarDocente } from '../api/asignaciones.js';
import { listarCursos } from '../api/cursos.js';
import { listarUsuarios } from '../api/usuarios.js';
import { useAuth } from '../hooks/useAuth.js';
import { ROLES } from '../shared/roles.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';
import SelectorVigencia from '../components/SelectorVigencia.jsx';
import { IconoAsignaciones } from '../components/Iconos.jsx';

export default function Asignaciones() {
  const { vigencia, rolesEfectivos } = useAuth();
  const [anioConsultado, setAnioConsultado] = useState(null);

  const anioMostrado = anioConsultado ?? vigencia?.id;
  const esVigenciaActiva = anioMostrado === vigencia?.id;
  const puedeAsignar = rolesEfectivos.includes(ROLES.COORDINADOR) && esVigenciaActiva;

  const [asignaciones, setAsignaciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [nueva, setNueva] = useState({ cursoId: '', docenteId: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const consultar = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const respuesta = await listarAsignaciones({ anio: anioMostrado });
      setAsignaciones(respuesta.data);

      if (puedeAsignar) {
        const [listadoCursos, listadoDocentes] = await Promise.all([
          listarCursos({ anio: anioMostrado }),
          listarUsuarios({ rol: ROLES.DOCENTE, activo: 'true', limite: 100, anio: anioMostrado })
        ]);
        setCursos(listadoCursos.data);
        setDocentes(listadoDocentes.data);
      }
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }, [puedeAsignar, anioMostrado]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  const guardar = async (evento) => {
    evento.preventDefault();
    setMensaje(null);
    setError(null);
    setGuardando(true);

    try {
      await asignarDocente(
        { cursoId: Number(nueva.cursoId), docenteId: Number(nueva.docenteId) },
        vigencia?.id
      );
      setNueva({ cursoId: '', docenteId: '' });
      setMensaje('Asignacion guardada');
      await consultar();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  };

  const retirar = async (fila) => {
    setMensaje(null);
    setError(null);

    try {
      await retirarDocente(fila.cursoId, fila.docenteId, vigencia?.id);
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
          <h1>Asignacion de tutores</h1>
          <p className="seccion__subtitulo">
            {`Enlace de docentes como tutores de curso durante la vigencia ${anioMostrado ?? ''}.`}
            {!esVigenciaActiva && ' Esta viendo un año anterior: solo puede consultarlo, no modificarlo.'}
          </p>
        </div>
      </div>

      <div className="barra-filtros">
        <SelectorVigencia valor={anioMostrado} alCambiar={setAnioConsultado} />
      </div>

      <Aviso tipo="error">{error}</Aviso>
      <Aviso tipo="exito">{mensaje}</Aviso>

      {puedeAsignar && (
        <form className="tarjeta tarjeta--sombra" onSubmit={guardar} style={{ marginBottom: 'var(--space-5)', maxWidth: 560 }}>
          <h2>Nueva asignacion</h2>
          <div className="rejilla-campos">
            <div className="campo">
              <label htmlFor="curso">Curso</label>
              <select
                id="curso"
                value={nueva.cursoId}
                onChange={(evento) => setNueva((previo) => ({ ...previo, cursoId: evento.target.value }))}
                required
              >
                <option value="">Seleccione un curso</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {`${curso.id} · ${curso.grado}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="docente">Docente</label>
              <select
                id="docente"
                value={nueva.docenteId}
                onChange={(evento) => setNueva((previo) => ({ ...previo, docenteId: evento.target.value }))}
                required
              >
                <option value="">Seleccione un docente</option>
                {docentes.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {`${docente.apellido} ${docente.nombre}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="boton" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Asignar docente'}
          </button>
        </form>
      )}

      {cargando ? (
        <Cargando mensaje="Consultando asignaciones" />
      ) : (
        <div className="tabla-envoltorio">
          <table className="tabla">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Grado</th>
                <th>Docente titular</th>
                <th>Rol</th>
                {puedeAsignar && <th aria-label="Acciones" />}
              </tr>
            </thead>
            <tbody>
              {asignaciones.map((fila) => (
                <tr key={`${fila.cursoId}-${fila.docenteId}`}>
                  <td data-etiqueta="Curso">{fila.cursoId}</td>
                  <td data-etiqueta="Grado">{fila.grado}</td>
                  <td data-etiqueta="Docente titular">{fila.docente}</td>
                  <td data-etiqueta="Rol">
                    <span className="insignia insignia--docente">{fila.rol}</span>
                  </td>
                  {puedeAsignar && (
                    <td data-etiqueta="Acciones" className="tabla__acciones">
                      <button type="button" className="boton boton--peligro boton--sm" onClick={() => retirar(fila)}>
                        Retirar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {asignaciones.length === 0 && (
            <div className="estado-vacio">
              <span className="estado-vacio__icono">
                <IconoAsignaciones width={22} height={22} />
              </span>
              <p>No hay docentes asignados en esta vigencia.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
