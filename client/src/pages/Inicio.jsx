import { useAuth } from '../hooks/useAuth.js';

export default function Inicio() {
  const { usuario, vigencia } = useAuth();

  return (
    <section className="seccion">
      <h1>Panel de administracion</h1>
      <p>
        {`Bienvenido, ${usuario?.nombre ?? ''}. Su rol actual es ${usuario?.rol ?? ''}`}
        {vigencia ? ` y la vigencia activa es ${vigencia.id}.` : '.'}
      </p>
    </section>
  );
}
