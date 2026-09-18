import { Link } from 'react-router-dom';

export default function NoEncontrado() {
  return (
    <section className="seccion">
      <h1>Pagina no encontrada</h1>
      <p>La direccion solicitada no existe en el panel.</p>
      <Link className="boton boton--claro" to="/">
        Volver al inicio
      </Link>
    </section>
  );
}
