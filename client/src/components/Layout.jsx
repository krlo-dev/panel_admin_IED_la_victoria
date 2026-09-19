import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { ROLES } from '../shared/roles.js';
import { MODO_DEMO } from '../api/cliente.js';
import logo from '../assets/logo.png';
import {
  IconoInicio,
  IconoUsuarios,
  IconoCursos,
  IconoCarga,
  IconoVigencias,
  IconoAuditoria,
  IconoSalir
} from './Iconos.jsx';

const ENLACES = [
  {
    ruta: '/',
    etiqueta: 'Inicio',
    icono: IconoInicio,
    roles: [ROLES.ESTUDIANTE, ROLES.DOCENTE, ROLES.COORDINADOR, ROLES.ADMINISTRADOR]
  },
  { ruta: '/usuarios', etiqueta: 'Usuarios', icono: IconoUsuarios, roles: [ROLES.ADMINISTRADOR] },
  { ruta: '/cursos', etiqueta: 'Cursos', icono: IconoCursos, roles: [ROLES.DOCENTE, ROLES.ADMINISTRADOR] },
  { ruta: '/carga-masiva', etiqueta: 'Carga masiva', icono: IconoCarga, roles: [ROLES.ADMINISTRADOR] },
  { ruta: '/cargar-estudiantes', etiqueta: 'Cargar estudiantes', icono: IconoCarga, roles: [ROLES.ADMINISTRADOR] },
  { ruta: '/vigencias', etiqueta: 'Vigencias', icono: IconoVigencias, roles: [ROLES.ADMINISTRADOR] },
  { ruta: '/auditoria', etiqueta: 'Auditoria', icono: IconoAuditoria, roles: [ROLES.ADMINISTRADOR] }
];

function iniciales(nombre = '', apellido = '') {
  const a = nombre.trim().charAt(0);
  const b = apellido.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || '?';
}

export default function Layout() {
  const { usuario, vigencia, rolesEfectivos, cerrarSesion } = useAuth();

  const enlaces = ENLACES.filter((enlace) => enlace.roles.some((rol) => rolesEfectivos.includes(rol)));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__marca">
          <img className="sidebar__logo" src={logo} alt="Escudo IED La Victoria" />
          <div className="sidebar__marca-texto">
            <span className="sidebar__marca-linea">
              <span className="sidebar__marca-nombre">IED La Victoria</span>
              {MODO_DEMO && <span className="sidebar__marca-demo">Demo</span>}
            </span>
            <span className="sidebar__marca-detalle">Proyecto C</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          <p className="sidebar__nav-titulo">Menu principal</p>
          {enlaces.map((enlace) => {
            const Icono = enlace.icono;
            return (
              <NavLink
                key={enlace.ruta}
                to={enlace.ruta}
                end={enlace.ruta === '/'}
                className="sidebar__enlace"
              >
                <Icono />
                {enlace.etiqueta}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__pie">
          {vigencia ? `Vigencia activa ${vigencia.id}` : 'Administracion de usuarios e identidad'}
        </div>
      </aside>

      <div className="contenido">
        <header className="topbar">
          <div className="topbar__mobile-marca">
            <img src={logo} alt="Escudo IED La Victoria" />
            <strong>IED La Victoria</strong>
          </div>

          <div className="topbar__usuario">
            <span className="avatar">{iniciales(usuario?.nombre, usuario?.apellido)}</span>
            <div>
              <p className="topbar__usuario-nombre">{`${usuario?.nombre ?? ''} ${usuario?.apellido ?? ''}`.trim()}</p>
              <p className="topbar__usuario-detalle">
                {usuario?.rol}
                {vigencia ? ` · vigencia ${vigencia.id}` : ''}
              </p>
            </div>
            <button type="button" className="boton-icono" onClick={cerrarSesion} title="Cerrar sesion" aria-label="Cerrar sesion">
              <IconoSalir width={17} height={17} />
            </button>
          </div>
        </header>

        <main className="contenido__principal">
          <Outlet />
        </main>

        <nav className="bottom-nav">
          {enlaces.map((enlace) => {
            const Icono = enlace.icono;
            return (
              <NavLink key={enlace.ruta} to={enlace.ruta} end={enlace.ruta === '/'} className="bottom-nav__enlace">
                <Icono width={20} height={20} />
                {enlace.etiqueta}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
