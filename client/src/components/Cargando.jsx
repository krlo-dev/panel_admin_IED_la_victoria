export default function Cargando({ mensaje = 'Cargando' }) {
  return (
    <div className="estado">
      <span className="estado__indicador" />
      <p>{mensaje}</p>
    </div>
  );
}
