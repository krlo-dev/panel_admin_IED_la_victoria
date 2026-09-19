import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { ROLES } from '../shared/roles.js';
import {
  IconoUsuarios,
  IconoCarga,
  IconoVigencias,
  IconoCursos,
  IconoAsignaciones,
  IconoAuditoria,
  IconoFlechaDerecha,
  IconoPerfil
} from '../components/Iconos.jsx';

const ACCESOS = [
  {
    ruta: '/usuarios',
    icono: IconoUsuarios,
    titulo: 'Gestion de usuarios',
    descripcion: 'Cree, edite y active o desactive cuentas institucionales.',
    roles: [ROLES.COORDINADOR]
  },
  {
    ruta: '/carga-masiva',
    icono: IconoCarga,
    titulo: 'Carga masiva CSV',
    descripcion: 'Importe usuarios con la plantilla institucional.',
    roles: [ROLES.COORDINADOR]
  },
  {
    ruta: '/auditoria',
    icono: IconoAuditoria,
    titulo: 'Auditoria',
    descripcion: 'Consulte el registro de acciones sobre los usuarios.',
    roles: [ROLES.COORDINADOR]
  },
  {
    ruta: '/cursos',
    icono: IconoCursos,
    titulo: 'Cursos',
    descripcion: 'Consulte los cursos de la institucion por vigencia.',
    roles: [ROLES.DOCENTE]
  },
  {
    ruta: '/asignaciones',
    icono: IconoAsignaciones,
    titulo: 'Asignacion de tutores',
    descripcion: 'Enlace docentes como tutores de un curso.',
    roles: [ROLES.DOCENTE]
  },
  {
    ruta: '/vigencias',
    icono: IconoVigencias,
    titulo: 'Vigencias academicas',
    descripcion: 'Consulte la vigencia activa y los años anteriores.',
    roles: [ROLES.DOCENTE]
  }
];

function formatearFecha(valor) {
  if (!valor) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(valor));
  } catch {
    return null;
  }
}

export default function Inicio() {
  const { usuario, vigencia, rolesEfectivos } = useAuth();

  const accesos = ACCESOS.filter((acceso) => acceso.roles.some((rol) => rolesEfectivos.includes(rol)));
  const inicioVigencia = formatearFecha(vigencia?.fechaInicio);
  const finVigencia = formatearFecha(vigencia?.fechaFin);

  return (
    <section className="seccion">
      <div className="seccion__migas">Sistema de gestion central</div>
      <div className="seccion__encabezado">
        <div>
          <h1>{`Bienvenido, ${usuario?.nombre ?? ''}`}</h1>
          <p className="seccion__subtitulo">
            {`Sesion iniciada como ${usuario?.rol ?? ''}`}
            {vigencia ? `, vigencia academica ${vigencia.id} activa` : ''}
            {inicioVigencia && finVigencia ? ` desde el ${inicioVigencia} hasta el ${finVigencia}` : ''}
          </p>
        </div>
      </div>

      {accesos.length > 0 ? (
        <>
          <h2 style={{ marginBottom: 'var(--space-4)' }}>Accesos directos</h2>
          <div className="rejilla-accesos">
            {accesos.map((acceso) => {
              const Icono = acceso.icono;
              return (
                <Link key={acceso.ruta} to={acceso.ruta} className="acceso-directo">
                  <span className="acceso-directo__icono">
                    <Icono width={20} height={20} />
                  </span>
                  <span className="acceso-directo__titulo">{acceso.titulo}</span>
                  <span className="acceso-directo__descripcion">{acceso.descripcion}</span>
                  <span className="acceso-directo__flecha">
                    Ir al modulo <IconoFlechaDerecha width={14} height={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <div className="tarjeta tarjeta--sombra" style={{ maxWidth: 460 }}>
          <span className="estado-vacio__icono" style={{ marginBottom: 'var(--space-2)' }}>
            <IconoPerfil width={22} height={22} />
          </span>
          <h2>Mi perfil</h2>
          <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.9rem' }}>
            {`${usuario?.nombre ?? ''} ${usuario?.apellido ?? ''}`.trim()}
          </p>
          <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem' }}>
            {usuario?.identificacion ? `Documento: ${usuario.identificacion}` : null}
          </p>
          <p style={{ color: 'var(--color-texto-suave)', fontSize: '0.85rem' }}>
            {usuario?.email ? `Correo: ${usuario.email}` : null}
          </p>
        </div>
      )}
    </section>
  );
}
