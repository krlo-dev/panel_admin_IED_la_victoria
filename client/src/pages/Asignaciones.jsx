import { useCallback, useEffect, useState } from 'react';
import { asignarDocente, listarAsignaciones, retirarDocente } from '../api/asignaciones.js';
import { listarCursos } from '../api/cursos.js';
import { listarUsuarios } from '../api/usuarios.js';
import { useAuth } from '../hooks/useAuth.js';
import { ROLES } from '../shared/roles.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';

export default function Asignaciones() {
  const { vigencia, rolesEfectivos } = useAuth();
  const puedeAsignar = rolesEfectivos.includes(ROLES.COORDINADOR);

  const [asignaciones, setAsignaciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [nueva, setNueva] = useState({ cursoId: '', docenteId: '' });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const consultar = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const anio = vigencia?.id;
      const respuesta = await listarAsignaciones({ anio });
      setAsignaciones(respuesta.data);

      if (puedeAsignar) {
        const [listadoCursos, listadoDocentes] = await Promise.all([
          listarCursos({ anio }),
          listarUsuarios({ rol: ROLES.DOCENTE, activo: 'true', limite: 100, anio })
        ]);
        setCursos(listadoCursos.data);
        setDocentes(listadoDocentes.data);
      }
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }, [puedeAsignar, vigencia?.id]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  const guardar = async (evento) => {
    evento.preventDefault();
    setMensaje(null);
    setError(null);

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

  if (cargando) {
    return <Cargando mensaje="Consultando asignaciones" />;
  }

  return (
    <section className="seccion">
      <h1>Docentes por curso</h1>
      <Aviso tipo="error">{error}</Aviso>
      <Aviso tipo="exito">{mensaje}</Aviso>

      {puedeAsignar && (
        <form className="tarjeta" onSubmit={guardar}>
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
                {`${curso.id} ${curso.grado}`}
              </option>
            ))}
          </select>

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

          <button type="submit" className="boton">
            Asignar
          </button>
        </form>
      )}

      <table className="tabla">
        <thead>
          <tr>
            <th>Curso</th>
            <th>Grado</th>
            <th>Docente</th>
            <th>Rol</th>
            {puedeAsignar && <th aria-label="Acciones" />}
          </tr>
        </thead>
        <tbody>
          {asignaciones.map((fila) => (
            <tr key={`${fila.cursoId}-${fila.docenteId}`}>
              <td>{fila.cursoId}</td>
              <td>{fila.grado}</td>
              <td>{fila.docente}</td>
              <td>{fila.rol}</td>
              {puedeAsignar && (
                <td>
                  <button type="button" className="boton boton--claro" onClick={() => retirar(fila)}>
                    Retirar
                  </button>
                </td>
              )}
            </tr>
          ))}
          {asignaciones.length === 0 && (
            <tr>
              <td colSpan={puedeAsignar ? 5 : 4}>No hay docentes asignados en esta vigencia</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
