const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export function IconoInicio(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function IconoUsuarios(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 4.3c1.5.4 2.6 1.8 2.6 3.4 0 1.6-1.1 3-2.6 3.4" />
      <path d="M15.5 14c2.6.4 4.5 2.7 4.5 6" />
    </svg>
  );
}

export function IconoCursos(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </svg>
  );
}

export function IconoAsignaciones(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="7" cy="7" r="3" />
      <path d="M2.5 19c0-2.8 2-5 4.5-5s4.5 2.2 4.5 5" />
      <path d="M15 10.5 17.2 12.7 21.5 8.4" />
    </svg>
  );
}

export function IconoCarga(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 15V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M4.5 14v4a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

export function IconoVigencias(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

export function IconoAuditoria(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.5h9l3 3V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M9 12h6M9 15.5h6M9 8.5h3" />
    </svg>
  );
}

export function IconoPerfil(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  );
}

export function IconoSalir(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h3" />
      <path d="M14.5 16.5 19 12l-4.5-4.5" />
      <path d="M19 12H9" />
    </svg>
  );
}

export function IconoBuscar(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

export function IconoCandado(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconoOjo(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function IconoOjoCerrado(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 3.5l17 17" />
      <path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a13.6 13.6 0 0 1-3.2 3.9M7.4 7.3C4.9 9 3 12 3 12s3.5 6.5 9.5 6.5c1.1 0 2.1-.2 3-.5" />
      <path d="M9.9 9.9a2.6 2.6 0 0 0 3.6 3.6" />
    </svg>
  );
}

export function IconoDocumento(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M14 3.5V8h4" />
    </svg>
  );
}

export function IconoAlerta(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 2.5 20h19z" />
      <path d="M12 10.5v4" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function IconoFlechaDerecha(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconoEscudo(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 5 6v6c0 4.2 3 7.3 7 8.5 4-1.2 7-4.3 7-8.5V6z" />
    </svg>
  );
}

export function IconoAuriculares(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 13.5V12a8 8 0 0 1 16 0v1.5" />
      <rect x="3" y="13.5" width="4" height="5.5" rx="1.5" />
      <rect x="17" y="13.5" width="4" height="5.5" rx="1.5" />
    </svg>
  );
}
