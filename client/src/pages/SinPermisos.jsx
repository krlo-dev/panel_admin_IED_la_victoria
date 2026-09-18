import { Link } from 'react-router-dom';

export default function SinPermisos() {
  return (
    <section className="seccion">
      <h1>Acceso restringido</h1>
      <p>Su rol no tiene permisos para consultar esta seccion.</p>
      <Link className="boton boton--claro" to="/">
        Volver al inicio
      </Link>
    </section>
  );
}
