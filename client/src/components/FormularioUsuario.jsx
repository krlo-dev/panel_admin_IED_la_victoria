import { useState } from 'react';
import { ROLES } from '../shared/roles.js';
import Aviso from './Aviso.jsx';

const VACIO = { identificacion: '', nombre: '', apellido: '', email: '', rol: ROLES.ESTUDIANTE, cursoId: '' };

export default function FormularioUsuario({ modo = 'crear', valoresIniciales, cursos = [], onGuardar, onCancelar }) {
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
        const payload = {
          identificacion: valores.identificacion,
          nombre: valores.nombre,
          apellido: valores.apellido,
          email: valores.email,
          rol: valores.rol,
          ...(valores.rol === ROLES.ESTUDIANTE ? { cursoId: valores.cursoId } : {})
        };
        await onGuardar(payload);
      } else {
        await onGuardar({ nombre: valores.nombre, apellido: valores.apellido, email: valores.email, rol: valores.rol });
      }
    } catch (fallo) {
      const detalles = fallo.detalles?.map((item) => item.mensaje).join(' ');
      setError(detalles || fallo.message);
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
            inputMode="numeric"
            pattern="\d{6,20}"
            title="Solo numeros, entre 6 y 20 digitos"
            required
          />
          {modo === 'crear' && (
            <span className="celda-identidad__detalle">Solo numeros, sin puntos ni guiones (6 a 20 digitos).</span>
          )}
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

        {modo === 'crear' && valores.rol === ROLES.ESTUDIANTE && (
          <div className="campo">
            <label htmlFor="cursoId">Curso</label>
            <select id="cursoId" value={valores.cursoId} onChange={cambiar('cursoId')} required>
              <option value="">Seleccione un curso...</option>
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.grado}
                </option>
              ))}
            </select>
            <span className="celda-identidad__detalle">
              El estudiante queda matriculado en este curso, en la vigencia que tiene seleccionada.
            </span>
          </div>
        )}
      </div>

      {modo === 'crear' && (
        <div className="aviso aviso--info" style={{ marginTop: 'var(--space-2)' }}>
          El usuario para iniciar sesion se genera solo a partir del correo, y la contrasena inicial es el
          numero de identificacion. No hace falta escribir ninguno de los dos.
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
