import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { ROLES } from '../shared/roles.js';

const ENLACES = [
  { ruta: '/', etiqueta: 'Inicio', roles: [ROLES.ESTUDIANTE, ROLES.DOCENTE, ROLES.COORDINADOR] },
  { ruta: '/usuarios', etiqueta: 'Usuarios', roles: [ROLES.COORDINADOR] },
  { ruta: '/cursos', etiqueta: 'Cursos', roles: [ROLES.DOCENTE, ROLES.COORDINADOR] },
  { ruta: '/asignaciones', etiqueta: 'Asignaciones', roles: [ROLES.DOCENTE, ROLES.COORDINADOR] },
  { ruta: '/carga-masiva', etiqueta: 'Carga masiva', roles: [ROLES.COORDINADOR] },
  { ruta: '/vigencias', etiqueta: 'Vigencias', roles: [ROLES.DOCENTE, ROLES.COORDINADOR] },
  { ruta: '/auditoria', etiqueta: 'Auditoria', roles: [ROLES.COORDINADOR] }
];

export default function Layout() {
  const { usuario, vigencia, rolesEfectivos, cerrarSesion } = useAuth();

  const enlaces = ENLACES.filter((enlace) => enlace.roles.some((rol) => rolesEfectivos.includes(rol)));

  return (
    <div className="panel">
      <aside className="panel__lateral">
        <p className="panel__marca">IED La Victoria</p>
        <nav className="panel__nav">
          {enlaces.map((enlace) => (
            <NavLink key={enlace.ruta} to={enlace.ruta} end={enlace.ruta === '/'}>
              {enlace.etiqueta}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="panel__contenido">
        <header className="panel__encabezado">
          <div>
            <p className="panel__usuario">{`${usuario?.nombre ?? ''} ${usuario?.apellido ?? ''}`.trim()}</p>
            <p className="panel__detalle">
              {usuario?.rol}
              {vigencia ? ` · vigencia ${vigencia.id}` : ''}
            </p>
          </div>
          <button type="button" className="boton boton--claro" onClick={cerrarSesion}>
            Cerrar sesion
          </button>
        </header>

        <main className="panel__principal">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
