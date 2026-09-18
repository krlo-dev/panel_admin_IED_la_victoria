export default function Aviso({ tipo = 'info', children }) {
  if (!children) {
    return null;
  }

  return <p className={`aviso aviso--${tipo}`}>{children}</p>;
}
