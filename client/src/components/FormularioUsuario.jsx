import { useState } from 'react';
import { ROLES } from '../shared/roles.js';
import Aviso from './Aviso.jsx';

const VACIO = { identificacion: '', usuario: '', nombre: '', apellido: '', email: '', rol: ROLES.ESTUDIANTE };

export default function FormularioUsuario({ modo = 'crear', valoresIniciales, onGuardar, onCancelar }) {
  const [valores, setValores] = useState({ ...VACIO, ...valoresIniciales });
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (evento) => {
    setValores((actual) => ({ ...actual, [campo]: evento.target.value }));
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setError(null);
    setGuardando(true);

    try {
      if (modo === 'crear') {
        await onGuardar(valores);
      } else {
        await onGuardar({ nombre: valores.nombre, apellido: valores.apellido, email: valores.email, rol: valores.rol });
      }
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar}>
      <div className="rejilla-campos">
        <div className="campo">
          <label htmlFor="identificacion">Numero de identificacion</label>
          <input
            id="identificacion"
            value={valores.identificacion}
            onChange={cambiar('identificacion')}
            disabled={modo === 'editar'}
            placeholder="Ej. 1042456789"
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            value={valores.usuario}
            onChange={cambiar('usuario')}
            disabled={modo === 'editar'}
            placeholder="Ej. docente1"
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="nombre">Nombres</label>
          <input id="nombre" value={valores.nombre} onChange={cambiar('nombre')} required />
        </div>

        <div className="campo">
          <label htmlFor="apellido">Apellidos</label>
          <input id="apellido" value={valores.apellido} onChange={cambiar('apellido')} required />
        </div>

        <div className="campo">
          <label htmlFor="email">Correo institucional</label>
          <input id="email" type="email" value={valores.email} onChange={cambiar('email')} required />
        </div>

        <div className="campo">
          <label htmlFor="rol">Rol institucional</label>
          <select id="rol" value={valores.rol} onChange={cambiar('rol')}>
            {Object.values(ROLES).map((rol) => (
              <option key={rol} value={rol}>
                {rol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {modo === 'crear' && (
        <div className="aviso aviso--info" style={{ marginTop: 'var(--space-2)' }}>
          La contrasena inicial se asigna automaticamente como el numero de identificacion (RN01).
        </div>
      )}

      <Aviso tipo="error">{error}</Aviso>

      <div className="modal__pie">
        <button type="button" className="boton boton--fantasma" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={guardando}>
          {guardando ? 'Guardando...' : modo === 'crear' ? 'Crear usuario' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
