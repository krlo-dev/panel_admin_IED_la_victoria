import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Cargando from './Cargando.jsx';

export default function RutaProtegida({ roles }) {
  const { autenticado, cargando, rolesEfectivos } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return <Cargando mensaje="Verificando la sesion" />;
  }

  if (!autenticado) {
    return <Navigate to="/ingresar" state={{ desde: ubicacion.pathname }} replace />;
  }

  if (roles?.length && !roles.some((rol) => rolesEfectivos.includes(rol))) {
    return <Navigate to="/sin-permisos" replace />;
  }

  return <Outlet />;
}
