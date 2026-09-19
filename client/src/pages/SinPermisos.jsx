import { Link } from 'react-router-dom';
import { IconoCandado } from '../components/Iconos.jsx';

export default function SinPermisos() {
  return (
    <div className="pantalla-mensaje">
      <div className="tarjeta tarjeta--sombra pantalla-mensaje__tarjeta">
        <span className="estado-vacio__icono">
          <IconoCandado width={26} height={26} />
        </span>
        <h1>Acceso restringido</h1>
        <p style={{ color: 'var(--color-texto-suave)' }}>
          Su rol institucional no tiene permisos para consultar esta seccion.
        </p>
        <Link className="boton boton--claro" to="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
