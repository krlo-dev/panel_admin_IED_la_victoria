import { IconoAlerta } from './Iconos.jsx';

export default function Aviso({ tipo = 'info', children }) {
  if (!children) {
    return null;
  }

  return (
    <p className={`aviso aviso--${tipo}`}>
      {tipo === 'error' && <IconoAlerta width={16} height={16} style={{ flexShrink: 0, marginTop: 2 }} />}
      <span>{children}</span>
    </p>
  );
}
