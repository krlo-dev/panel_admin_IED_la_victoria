import { useEffect } from 'react';

export default function Modal({ titulo, subtitulo, onCerrar, children, ancho = 480 }) {
  useEffect(() => {
    const alPresionar = (evento) => {
      if (evento.key === 'Escape') {
        onCerrar();
      }
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  return (
    <div className="modal-fondo" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" style={{ maxWidth: ancho }} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="modal__cabecera">
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p className="modal__subtitulo">{subtitulo}</p>}
          </div>
          <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="modal__cuerpo">{children}</div>
      </div>
    </div>
  );
}
