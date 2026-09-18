import { useEffect, useState } from 'react';
import { listarCursos } from '../api/cursos.js';
import { useAuth } from '../hooks/useAuth.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';

export default function Cursos() {
  const { vigencia } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vigente = true;

    listarCursos({ anio: vigencia?.id })
      .then((respuesta) => vigente && setRegistros(respuesta.data))
      .catch((fallo) => vigente && setError(fallo.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [vigencia?.id]);

  if (cargando) {
    return <Cargando mensaje="Consultando cursos" />;
  }

  return (
    <section className="seccion">
      <h1>Cursos</h1>
      <Aviso tipo="error">{error}</Aviso>

      <table className="tabla">
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Grado</th>
            <th>Estudiantes</th>
            <th>Docentes</th>
            <th>Alcance</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((curso) => (
            <tr key={curso.id}>
              <td>{curso.id}</td>
              <td>{curso.grado}</td>
              <td>{curso.estudiantes}</td>
              <td>{curso.docentes}</td>
              <td>{curso.administrable ? 'Administra' : 'Solo consulta'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
