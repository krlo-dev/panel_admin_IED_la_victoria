import { useAuth } from '../hooks/useAuth.js';

export default function PermisoRol({ roles, children, alterno = null }) {
  const { rolesEfectivos } = useAuth();
  const permitido = roles.some((rol) => rolesEfectivos.includes(rol));

  return permitido ? children : alterno;
}
