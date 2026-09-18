import { useState } from 'react';
import { enviarCargaMasiva } from '../api/cargas.js';
import { useAuth } from '../hooks/useAuth.js';
import Aviso from '../components/Aviso.jsx';

export default function CargaMasiva() {
  const { vigencia } = useAuth();
  const [archivo, setArchivo] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [errores, setErrores] = useState([]);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!archivo) {
      return;
    }

    setEnviando(true);
    setError(null);
    setErrores([]);
    setResumen(null);

    try {
      const respuesta = await enviarCargaMasiva(archivo, vigencia?.id);
      setResumen(respuesta.data);
    } catch (fallo) {
      setError(fallo.message);
      setErrores(fallo.detalles?.errores ?? []);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="seccion">
      <h1>Carga masiva de estudiantes</h1>
      <p>
        El archivo debe conservar el encabezado institucional: Ano, idCurso, Usuario, Identificacion, Apellidos,
        Nombres, E-Mail. Si alguna fila presenta errores el archivo se rechaza completo y no se crea ningun
        usuario. La contrasena inicial de cada estudiante es su numero de documento.
      </p>

      <form className="tarjeta" onSubmit={enviar}>
        <label htmlFor="archivo">Archivo CSV</label>
        <input
          id="archivo"
          type="file"
          accept=".csv,text/csv"
          onChange={(evento) => setArchivo(evento.target.files?.[0] ?? null)}
          required
        />
        <button type="submit" className="boton" disabled={enviando || !archivo}>
          {enviando ? 'Validando' : 'Cargar archivo'}
        </button>
      </form>

      <Aviso tipo="error">{error}</Aviso>

      {resumen && (
        <Aviso tipo="exito">{`Archivo aceptado: ${resumen.creados} estudiantes creados en la vigencia ${resumen.anio}`}</Aviso>
      )}

      {errores.length > 0 && (
        <table className="tabla">
          <thead>
            <tr>
              <th>Fila</th>
              <th>Errores</th>
            </tr>
          </thead>
          <tbody>
            {errores.map((fila) => (
              <tr key={fila.fila}>
                <td>{fila.fila}</td>
                <td>{fila.mensajes.join('. ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
