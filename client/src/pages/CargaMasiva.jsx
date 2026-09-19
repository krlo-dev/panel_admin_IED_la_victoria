import { useRef, useState } from 'react';
import { descargarPlantilla, enviarCargaMasiva } from '../api/cargas.js';
import { useAuth } from '../hooks/useAuth.js';
import Aviso from '../components/Aviso.jsx';
import { IconoCarga, IconoDocumento, IconoAlerta } from '../components/Iconos.jsx';

const ENCABEZADO = ['Año', 'idCurso', 'Usuario', 'Identificación', 'Apellidos', 'Nombres', 'E-Mail'];

function formatearTamano(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function CargaMasiva() {
  const { vigencia } = useAuth();
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [errores, setErrores] = useState([]);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const elegirArchivo = (lista) => {
    const elegido = lista?.[0] ?? null;
    setArchivo(elegido);
    setResumen(null);
    setErrores([]);
    setError(null);
  };

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

  const descargarPlantillaOficial = async () => {
    setDescargando(true);
    setError(null);
    try {
      await descargarPlantilla();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <section className="seccion">
      <div className="seccion__migas">Modulo de admision masiva · Vigencia {vigencia?.id ?? ''}</div>
      <div className="seccion__encabezado">
        <div>
          <h1>Carga masiva de usuarios por CSV</h1>
          <p className="seccion__subtitulo">
            Importe estudiantes con la plantilla institucional. Si alguna fila del archivo tiene errores,
            no se procesa ninguna, para que la base nunca quede con datos a medias.
          </p>
        </div>
        <div className="seccion__acciones">
          <button type="button" className="boton boton--claro" onClick={descargarPlantillaOficial} disabled={descargando}>
            {descargando ? 'Descargando...' : 'Descargar plantilla oficial (.csv)'}
          </button>
        </div>
      </div>

      <div className="rejilla-campos" style={{ gridTemplateColumns: '1.3fr 1fr', gap: 'var(--space-5)', alignItems: 'start' }}>
        <form onSubmit={enviar}>
          <label
            htmlFor="archivo"
            className="tarjeta tarjeta--sombra"
            style={{
              alignItems: 'center',
              textAlign: 'center',
              gap: 'var(--space-3)',
              borderStyle: 'dashed',
              borderWidth: 2,
              borderColor: arrastrando ? 'var(--color-primario)' : 'var(--color-borde)',
              padding: 'var(--space-7) var(--space-5)',
              cursor: 'pointer'
            }}
            onDragOver={(evento) => {
              evento.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(evento) => {
              evento.preventDefault();
              setArrastrando(false);
              elegirArchivo(evento.dataTransfer.files);
            }}
          >
            <span className="estado-vacio__icono">
              <IconoCarga width={26} height={26} />
            </span>
            <strong>Arrastra tu archivo CSV aqui o haz clic para seleccionar</strong>
            <span className="celda-identidad__detalle">Codificacion UTF-8, delimitado por comas. Maximo 2 MB.</span>
            <input
              id="archivo"
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(evento) => elegirArchivo(evento.target.files)}
              style={{ display: 'none' }}
            />
          </label>

          {archivo && (
            <div className="tarjeta" style={{ marginTop: 'var(--space-4)', flexDirection: 'row', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span className="estadistica__icono">
                <IconoDocumento width={18} height={18} />
              </span>
              <div style={{ flex: 1 }}>
                <div className="celda-identidad__nombre">{archivo.name}</div>
                <div className="celda-identidad__detalle">{formatearTamano(archivo.size)}</div>
              </div>
              <button type="submit" className="boton" disabled={enviando}>
                {enviando ? 'Validando...' : 'Cargar archivo'}
              </button>
            </div>
          )}

          <Aviso tipo="error">{error}</Aviso>

          {resumen && (
            <Aviso tipo="exito">
              {`Archivo aceptado: ${resumen.creados} estudiantes creados en la vigencia ${resumen.anio}.`}
            </Aviso>
          )}

          {errores.length > 0 && (
            <div style={{ marginTop: 'var(--space-4)' }}>
              <div className="aviso aviso--error" style={{ marginBottom: 'var(--space-3)' }}>
                <IconoAlerta width={18} height={18} />
                <span>
                  Bloqueo de carga activo: se encontraron {errores.length} filas con inconsistencias. No se
                  admiten cargas parciales, corrija el archivo y vuelva a intentar.
                </span>
              </div>

              <div className="tabla-envoltorio">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Errores detectados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errores.map((fila) => (
                      <tr key={fila.fila}>
                        <td data-etiqueta="Fila">#{fila.fila}</td>
                        <td data-etiqueta="Errores">{fila.mensajes.join('. ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </form>

        <aside className="tarjeta">
          <h2>Estructura obligatoria</h2>
          <p className="celda-identidad__detalle">
            La cabecera debe coincidir exactamente, sin espacios adicionales:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
            {ENCABEZADO.map((columna) => (
              <span key={columna} className="insignia insignia--inactivo">
                {columna}
              </span>
            ))}
          </div>
          <p className="celda-identidad__detalle" style={{ marginTop: 'var(--space-3)' }}>
            Los usuarios se crean con rol <strong>Estudiante</strong> y su contrasena inicial es su numero
            de identificacion.
          </p>
        </aside>
      </div>
    </section>
  );
}
