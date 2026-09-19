import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  cambiarEstadoUsuario,
  crearUsuario,
  actualizarUsuario,
  listarUsuarios,
  restablecerContrasena
} from '../api/usuarios.js';
import { ROLES } from '../shared/roles.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';
import Modal from '../components/Modal.jsx';
import FormularioUsuario from '../components/FormularioUsuario.jsx';
import { IconoBuscar, IconoUsuarios } from '../components/Iconos.jsx';

const PESTANAS = [
  { valor: '', etiqueta: 'Todos' },
  { valor: ROLES.ESTUDIANTE, etiqueta: 'Estudiantes' },
  { valor: ROLES.DOCENTE, etiqueta: 'Docentes' },
  { valor: ROLES.COORDINADOR, etiqueta: 'Coordinadores' }
];

function iniciales(nombre = '', apellido = '') {
  return `${nombre.trim().charAt(0)}${apellido.trim().charAt(0)}`.toUpperCase() || '?';
}

function claseInsigniaRol(rol) {
  if (rol === ROLES.COORDINADOR) return 'insignia insignia--coordinador';
  if (rol === ROLES.DOCENTE) return 'insignia insignia--docente';
  return 'insignia insignia--estudiante';
}

export default function Usuarios() {
  const [registros, setRegistros] = useState([]);
  const [conteos, setConteos] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [rol, setRol] = useState('');
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const [meta, setMeta] = useState({ total: 0, limite: 20 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [modal, setModal] = useState(null);

  const consultar = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const respuesta = await listarUsuarios({
        busqueda: busqueda || undefined,
        rol: rol || undefined,
        activo: estado || undefined,
        pagina,
        limite: 10
      });
      setRegistros(respuesta.data);
      setMeta(respuesta.meta ?? { total: respuesta.data.length, limite: 10 });
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }, [busqueda, rol, estado, pagina]);

  const consultarConteos = useCallback(async () => {
    try {
      const [todos, estudiantes, docentes, coordinadores] = await Promise.all([
        listarUsuarios({ limite: 1 }),
        listarUsuarios({ rol: ROLES.ESTUDIANTE, limite: 1 }),
        listarUsuarios({ rol: ROLES.DOCENTE, limite: 1 }),
        listarUsuarios({ rol: ROLES.COORDINADOR, limite: 1 })
      ]);
      setConteos({
        [ROLES.ESTUDIANTE]: estudiantes.meta?.total ?? 0,
        [ROLES.DOCENTE]: docentes.meta?.total ?? 0,
        [ROLES.COORDINADOR]: coordinadores.meta?.total ?? 0,
        total: todos.meta?.total ?? 0
      });
    } catch {
      setConteos({});
    }
  }, []);

  useEffect(() => {
    consultar();
  }, [consultar]);

  useEffect(() => {
    consultarConteos();
  }, [consultarConteos]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, rol, estado]);

  const totalPaginas = useMemo(() => Math.max(1, Math.ceil((meta.total ?? 0) / (meta.limite ?? 10))), [meta]);

  const alternarEstado = async (usuario) => {
    setMensaje(null);
    try {
      await cambiarEstadoUsuario(usuario.id, usuario.estado !== 'Activo');
      await Promise.all([consultar(), consultarConteos()]);
      setMensaje(`El usuario ${usuario.usuario} quedo ${usuario.estado === 'Activo' ? 'bloqueado' : 'activo'}`);
    } catch (fallo) {
      setError(fallo.message);
    }
  };

  const restablecer = async (usuario) => {
    setError(null);
    try {
      await restablecerContrasena(usuario.id);
      setMensaje(`La contrasena de ${usuario.usuario} quedo en su numero de documento`);
    } catch (fallo) {
      setError(fallo.message);
    }
  };

  const crear = async (datos) => {
    await crearUsuario(datos);
    setModal(null);
    setMensaje(`Usuario ${datos.usuario} creado correctamente`);
    await Promise.all([consultar(), consultarConteos()]);
  };

  const editar = async (id, datos) => {
    await actualizarUsuario(id, datos);
    setModal(null);
    setMensaje('Usuario actualizado correctamente');
    await Promise.all([consultar(), consultarConteos()]);
  };

  return (
    <section className="seccion">
      <div className="seccion__migas">IED La Victoria · Proyecto C · Directorio activo</div>
      <div className="seccion__encabezado">
        <div>
          <h1>Gestion de usuarios e identidad</h1>
          <p className="seccion__subtitulo">Directorio unificado de administracion y control de acceso institucional</p>
        </div>
        <div className="seccion__acciones">
          <button type="button" className="boton" onClick={() => setModal({ modo: 'crear' })}>
            + Crear nuevo usuario
          </button>
        </div>
      </div>

      <div className="rejilla-estadisticas">
        <div className="estadistica">
          <div className="estadistica__cabecera">
            Total usuarios
            <span className="estadistica__icono">
              <IconoUsuarios width={16} height={16} />
            </span>
          </div>
          <span className="estadistica__valor">{conteos.total ?? '—'}</span>
        </div>
        <div className="estadistica">
          <div className="estadistica__cabecera">Estudiantes</div>
          <span className="estadistica__valor">{conteos[ROLES.ESTUDIANTE] ?? '—'}</span>
        </div>
        <div className="estadistica">
          <div className="estadistica__cabecera">Docentes</div>
          <span className="estadistica__valor">{conteos[ROLES.DOCENTE] ?? '—'}</span>
        </div>
        <div className="estadistica">
          <div className="estadistica__cabecera">Coordinadores</div>
          <span className="estadistica__valor">{conteos[ROLES.COORDINADOR] ?? '—'}</span>
        </div>
      </div>

      <div className="tabs">
        {PESTANAS.map((pestana) => (
          <button
            key={pestana.valor || 'todos'}
            type="button"
            className={`tabs__item ${rol === pestana.valor ? 'active' : ''}`}
            onClick={() => setRol(pestana.valor)}
          >
            {pestana.etiqueta}
            {pestana.valor && conteos[pestana.valor] !== undefined ? ` (${conteos[pestana.valor]})` : ''}
          </button>
        ))}
      </div>

      <div className="barra-filtros">
        <div className="campo-busqueda">
          <IconoBuscar />
          <input
            type="search"
            placeholder="Buscar por documento, nombre o usuario..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
        </div>
        <select value={estado} onChange={(evento) => setEstado(evento.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Estado: Todos</option>
          <option value="true">Activo</option>
          <option value="false">Bloqueado</option>
        </select>
      </div>

      <Aviso tipo="error">{error}</Aviso>
      <Aviso tipo="exito">{mensaje}</Aviso>

      {cargando ? (
        <Cargando mensaje="Consultando usuarios" />
      ) : (
        <div className="tabla-envoltorio">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre y documento</th>
                <th>Correo institucional</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <tr key={registro.id}>
                  <td data-etiqueta="Nombre y documento">
                    <div className="celda-identidad">
                      <span className="avatar">{iniciales(registro.nombre, registro.apellido)}</span>
                      <div>
                        <div className="celda-identidad__nombre">{`${registro.nombre} ${registro.apellido}`}</div>
                        <div className="celda-identidad__detalle">
                          {registro.identificacion} · {registro.usuario}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td data-etiqueta="Correo">{registro.email}</td>
                  <td data-etiqueta="Rol">
                    <span className={claseInsigniaRol(registro.rol)}>{registro.rol}</span>
                  </td>
                  <td data-etiqueta="Estado">
                    <span className={`insignia insignia--${registro.estado === 'Activo' ? 'activo' : 'inactivo'}`}>
                      {registro.estado}
                    </span>
                  </td>
                  <td data-etiqueta="Acciones" className="tabla__acciones">
                    <button type="button" className="boton boton--claro boton--sm" onClick={() => setModal({ modo: 'editar', registro })}>
                      Editar
                    </button>
                    <button type="button" className="boton boton--claro boton--sm" onClick={() => restablecer(registro)}>
                      Restablecer clave
                    </button>
                    <button
                      type="button"
                      className={`boton boton--enlace boton--sm ${registro.estado === 'Activo' ? 'boton--peligro-texto' : 'boton--exito-texto'}`}
                      onClick={() => alternarEstado(registro)}
                    >
                      {registro.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {registros.length === 0 && (
            <div className="estado-vacio">
              <span className="estado-vacio__icono">
                <IconoUsuarios width={24} height={24} />
              </span>
              <p>No hay usuarios para los filtros aplicados.</p>
            </div>
          )}

          {registros.length > 0 && (
            <div className="paginacion">
              <span>
                Mostrando {registros.length} de {meta.total} usuarios
              </span>
              <div className="paginacion__controles">
                <button
                  type="button"
                  className="paginacion__pagina"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
                >
                  ‹
                </button>
                <button type="button" className="paginacion__pagina active">
                  {pagina}
                </button>
                <span>de {totalPaginas}</span>
                <button
                  type="button"
                  className="paginacion__pagina"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {modal?.modo === 'crear' && (
        <Modal titulo="Crear nuevo usuario" subtitulo="El usuario quedara activo de inmediato" onCerrar={() => setModal(null)}>
          <FormularioUsuario modo="crear" onGuardar={crear} onCancelar={() => setModal(null)} />
        </Modal>
      )}

      {modal?.modo === 'editar' && (
        <Modal titulo="Editar usuario" subtitulo={modal.registro.usuario} onCerrar={() => setModal(null)}>
          <FormularioUsuario
            modo="editar"
            valoresIniciales={modal.registro}
            onGuardar={(datos) => editar(modal.registro.id, datos)}
            onCancelar={() => setModal(null)}
          />
        </Modal>
      )}
    </section>
  );
}
