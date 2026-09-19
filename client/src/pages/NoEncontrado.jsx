import { Link } from 'react-router-dom';
import { IconoBuscar } from '../components/Iconos.jsx';

export default function NoEncontrado() {
  return (
    <div className="pantalla-mensaje">
      <div className="tarjeta tarjeta--sombra pantalla-mensaje__tarjeta">
        <span className="estado-vacio__icono">
          <IconoBuscar width={26} height={26} />
        </span>
        <h1>Pagina no encontrada</h1>
        <p style={{ color: 'var(--color-texto-suave)' }}>La direccion solicitada no existe en el panel.</p>
        <Link className="boton boton--claro" to="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
