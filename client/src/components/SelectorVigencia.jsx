import { useEffect, useState } from 'react';
import { listarVigencias } from '../api/vigencias.js';

export default function SelectorVigencia({ valor, alCambiar }) {
  const [vigencias, setVigencias] = useState([]);

  useEffect(() => {
    let vigente = true;

    listarVigencias()
      .then((respuesta) => vigente && setVigencias(respuesta.data))
      .catch(() => vigente && setVigencias([]));

    return () => {
      vigente = false;
    };
  }, []);

  if (vigencias.length <= 1) {
    return null;
  }

  return (
    <div className="campo" style={{ minWidth: 220, marginBottom: 0 }}>
      <label htmlFor="selector-vigencia">Año a consultar</label>
      <select
        id="selector-vigencia"
        value={valor ?? ''}
        onChange={(evento) => alCambiar(Number(evento.target.value))}
      >
        {vigencias.map((vigencia) => (
          <option key={vigencia.id} value={vigencia.id}>
            {vigencia.activa ? `${vigencia.anio} (vigencia activa)` : `${vigencia.anio} (historico)`}
          </option>
        ))}
      </select>
    </div>
  );
}
