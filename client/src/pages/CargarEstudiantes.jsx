import { useCallback, useEffect, useMemo, useState } from 'react';
import { crearCurso, listarCursos } from '../api/cursos.js';
import { crearUsuariosLote } from '../api/usuarios.js';
import { useAuth } from '../hooks/useAuth.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';
import { IconoCarga } from '../components/Iconos.jsx';

const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F'];
const CURSO_VACIO = { grado: '', seccion: 'A' };
const FILA_VACIA = { identificacion: '', nombre: '', apellido: '', email: '' };
const IDENTIFICACION_RE = /^\d{6,20}$/;
const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function CargarEstudiantes() {
  const { vigencia } = useAuth();

  const [cursos, setCursos] = useState([]);
  const [cargandoCursos, setCargandoCursos] = useState(true);
  const [errorCursos, setErrorCursos] = useState(null);

  const [origen, setOrigen] = useState('existente');
  const [cursoElegidoId, setCursoElegidoId] = useState('');
  const [nuevoCurso, setNuevoCurso] = useState(CURSO_VACIO);
  const [creandoCurso, setCreandoCurso] = useState(false);
  const [errorCurso, setErrorCurso] = useState(null);
  const [cursoActivo, setCursoActivo] = useState(null);

  const [filas, setFilas] = useState([]);
  const [nuevaFila, setNuevaFila] = useState(FILA_VACIA);
  const [errorFila, setErrorFila] = useState(null);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [erroresLote, setErroresLote] = useState([]);
  const [resumen, setResumen] = useState(null);

  const cargarCursos = useCallback(() => {
    let vigente = true;
    setCargandoCursos(true);

    listarCursos({ anio: vigencia?.id })
      .then((respuesta) => vigente && setCursos(respuesta.data))
      .catch((fallo) => vigente && setErrorCursos(fallo.message))
      .finally(() => vigente && setCargandoCursos(false));

    return () => {
      vigente = false;
    };
  }, [vigencia?.id]);

  useEffect(() => cargarCursos(), [cargarCursos]);

  const idCalculado = nuevoCurso.grado
    ? Number(nuevoCurso.grado) * 100 + 11 + SECCIONES.indexOf(nuevoCurso.seccion)
    : null;
  const etiquetaCalculada = nuevoCurso.grado ? `${nuevoCurso.grado}${nuevoCurso.seccion}` : '';

  const elegirCursoExistente = (evento) => {
    const id = evento.target.value;
    setCursoElegidoId(id);
    const curso = cursos.find((registro) => String(registro.id) === id);
    if (curso) {
      setCursoActivo(curso);
    }
  };

  const crearCursoYContinuar = async (evento) => {
    evento.preventDefault();
    setErrorCurso(null);
    setCreandoCurso(true);

    try {
      const respuesta = await crearCurso({ grado: Number(nuevoCurso.grado), seccion: nuevoCurso.seccion });
      setCursoActivo(respuesta.data);
      cargarCursos();
    } catch (fallo) {
      setErrorCurso(fallo.message);
    } finally {
      setCreandoCurso(false);
    }
  };

  const cambiarCurso = () => {
    setCursoActivo(null);
    setCursoElegidoId('');
    setNuevoCurso(CURSO_VACIO);
    setFilas([]);
    setErroresLote([]);
    setResumen(null);
    setError(null);
  };

  const agregarFila = (evento) => {
    evento.preventDefault();
    setErrorFila(null);

    const identificacion = nuevaFila.identificacion.trim();
    const nombre = nuevaFila.nombre.trim();
    const apellido = nuevaFila.apellido.trim();
    const email = nuevaFila.email.trim();

    if (!IDENTIFICACION_RE.test(identificacion)) {
      setErrorFila('La identificacion debe tener entre 6 y 20 digitos, solo numeros.');
      return;
    }
    if (!nombre || !apellido) {
      setErrorFila('Los nombres y apellidos son obligatorios.');
      return;
    }
    if (!CORREO_RE.test(email)) {
      setErrorFila('El correo no tiene un formato valido.');
      return;
    }
    if (filas.some((fila) => fila.identificacion === identificacion)) {
      setErrorFila('Ya hay un estudiante con esa identificacion en la lista.');
      return;
    }
    if (filas.some((fila) => fila.email.toLowerCase() === email.toLowerCase())) {
      setErrorFila('Ya hay un estudiante con ese correo en la lista.');
      return;
    }

    setFilas((actual) => [...actual, { identificacion, nombre, apellido, email }]);
    setNuevaFila(FILA_VACIA);
    setErroresLote([]);
    setResumen(null);
  };

  const quitarFila = (indice) => {
    setFilas((actual) => actual.filter((_, i) => i !== indice));
    setErroresLote([]);
  };

  const erroresPorFila = useMemo(() => {
    const mapa = new Map();
    erroresLote.forEach((error) => mapa.set(error.fila - 1, error.mensajes));
    return mapa;
  }, [erroresLote]);

  const guardarLote = async () => {
    if (!cursoActivo || filas.length === 0) {
      return;
    }

    setGuardando(true);
    setError(null);
    setErroresLote([]);
    setResumen(null);

    try {
      const respuesta = await crearUsuariosLote({ cursoId: cursoActivo.id, estudiantes: filas }, vigencia?.id);
      setResumen(respuesta.data);
      setFilas([]);
    } catch (fallo) {
      setError(fallo.message);
      setErroresLote(fallo.detalles?.errores ?? []);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="seccion">
      <div className="seccion__migas">Gestion curricular · IED La Victoria</div>
      <div className="seccion__encabezado">
        <div>
          <h1>Cargar estudiantes</h1>
          <p className="seccion__subtitulo">
            Elija o cree el curso y agregue estudiantes uno por uno, sin necesidad de un archivo CSV. Se
            matriculan en la vigencia {vigencia?.id ?? ''}.
          </p>
        </div>
      </div>

      {!cursoActivo && (
        <div className="tarjeta">
          <h2>Paso 1 · Curso</h2>

          <div className="seccion__acciones" style={{ marginBottom: 'var(--space-4)' }}>
            <button
              type="button"
              className={origen === 'existente' ? 'boton' : 'boton boton--fantasma'}
              onClick={() => setOrigen('existente')}
            >
              Usar curso existente
            </button>
            <button
              type="button"
              className={origen === 'nuevo' ? 'boton' : 'boton boton--fantasma'}
              onClick={() => setOrigen('nuevo')}
            >
              Crear curso nuevo
            </button>
          </div>

          {origen === 'existente' ? (
            cargandoCursos ? (
              <Cargando mensaje="Consultando cursos" />
            ) : (
              <div className="campo">
                <label htmlFor="cursoExistente">Curso</label>
                <select id="cursoExistente" value={cursoElegidoId} onChange={elegirCursoExistente}>
                  <option value="">Seleccione un curso...</option>
                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.grado}
                    </option>
                  ))}
                </select>
                <Aviso tipo="error">{errorCursos}</Aviso>
              </div>
            )
          ) : (
            <form onSubmit={crearCursoYContinuar}>
              <div className="rejilla-campos">
                <div className="campo">
                  <label htmlFor="grado">Grado (1 a 11)</label>
                  <input
                    id="grado"
                    type="number"
                    min="1"
                    max="11"
                    value={nuevoCurso.grado}
                    onChange={(evento) => setNuevoCurso((previo) => ({ ...previo, grado: evento.target.value }))}
                    required
                  />
                </div>
                <div className="campo">
                  <label htmlFor="seccion">Seccion</label>
                  <select
                    id="seccion"
                    value={nuevoCurso.seccion}
                    onChange={(evento) => setNuevoCurso((previo) => ({ ...previo, seccion: evento.target.value }))}
                  >
                    {SECCIONES.map((letra) => (
                      <option key={letra} value={letra}>
                        {letra}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {nuevoCurso.grado && (
                <div className="aviso aviso--info" style={{ marginTop: 'var(--space-2)' }}>
                  {`Se creara como curso ${etiquetaCalculada}, con id ${idCalculado}.`}
                </div>
              )}

              <Aviso tipo="error">{errorCurso}</Aviso>

              <div className="modal__pie">
                <button type="submit" className="boton" disabled={creandoCurso}>
                  {creandoCurso ? 'Creando...' : 'Crear y continuar'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {cursoActivo && (
        <>
          <div className="tarjeta" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="estadistica__icono">
              <IconoCarga width={18} height={18} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="celda-identidad__nombre">{`Curso activo: ${cursoActivo.grado}`}</div>
              <div className="celda-identidad__detalle">{`id ${cursoActivo.id} · vigencia ${vigencia?.id ?? ''}`}</div>
            </div>
            <button type="button" className="boton boton--fantasma" onClick={cambiarCurso}>
              Cambiar curso
            </button>
          </div>

          <div className="tarjeta" style={{ marginTop: 'var(--space-4)' }}>
            <h2>Paso 2 · Estudiantes</h2>

            <form onSubmit={agregarFila}>
              <div className="rejilla-campos">
                <div className="campo">
                  <label htmlFor="identificacionFila">Numero de identificacion</label>
                  <input
                    id="identificacionFila"
                    value={nuevaFila.identificacion}
                    onChange={(evento) => setNuevaFila((previo) => ({ ...previo, identificacion: evento.target.value }))}
                    placeholder="Ej. 1042456789"
                    inputMode="numeric"
                  />
                </div>
                <div className="campo">
                  <label htmlFor="nombreFila">Nombres</label>
                  <input
                    id="nombreFila"
                    value={nuevaFila.nombre}
                    onChange={(evento) => setNuevaFila((previo) => ({ ...previo, nombre: evento.target.value }))}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="apellidoFila">Apellidos</label>
                  <input
                    id="apellidoFila"
                    value={nuevaFila.apellido}
                    onChange={(evento) => setNuevaFila((previo) => ({ ...previo, apellido: evento.target.value }))}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="emailFila">Correo institucional</label>
                  <input
                    id="emailFila"
                    type="email"
                    value={nuevaFila.email}
                    onChange={(evento) => setNuevaFila((previo) => ({ ...previo, email: evento.target.value }))}
                  />
                </div>
              </div>

              <Aviso tipo="error">{errorFila}</Aviso>

              <div className="modal__pie">
                <button type="submit" className="boton boton--claro">
                  + Agregar a la lista
                </button>
              </div>
            </form>

            {filas.length > 0 && (
              <div className="tabla-envoltorio" style={{ marginTop: 'var(--space-4)' }}>
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Identificacion</th>
                      <th>Nombres</th>
                      <th>Apellidos</th>
                      <th>Correo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila, indice) => (
                      <tr key={fila.identificacion}>
                        <td data-etiqueta="Identificacion">
                          {fila.identificacion}
                          {erroresPorFila.has(indice) && (
                            <div className="aviso aviso--error" style={{ marginTop: 'var(--space-1)' }}>
                              <span>{erroresPorFila.get(indice).join('. ')}</span>
                            </div>
                          )}
                        </td>
                        <td data-etiqueta="Nombres">{fila.nombre}</td>
                        <td data-etiqueta="Apellidos">{fila.apellido}</td>
                        <td data-etiqueta="Correo">{fila.email}</td>
                        <td data-etiqueta="Quitar">
                          <button type="button" className="boton-icono" onClick={() => quitarFila(indice)} aria-label="Quitar">
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Aviso tipo="error">{error}</Aviso>
            {resumen && (
              <Aviso tipo="exito">
                {`Se crearon ${resumen.creados} ${resumen.creados === 1 ? 'estudiante' : 'estudiantes'} en el curso ${resumen.curso} (vigencia ${resumen.anio}).`}
              </Aviso>
            )}

            <div className="modal__pie">
              <span className="celda-identidad__detalle">
                {filas.length === 0 ? 'Aun no ha agregado estudiantes.' : `${filas.length} estudiante(s) en la lista.`}
              </span>
              <button type="button" className="boton" disabled={filas.length === 0 || guardando} onClick={guardarLote}>
                {guardando ? 'Guardando...' : `Guardar ${filas.length || ''} estudiante(s)`}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
