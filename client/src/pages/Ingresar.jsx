import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Aviso from '../components/Aviso.jsx';

export default function Ingresar() {
  const { autenticado, iniciarSesion } = useAuth();
  const ubicacion = useLocation();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (autenticado) {
    return <Navigate to={ubicacion.state?.desde ?? '/'} replace />;
  }

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      await iniciarSesion(usuario.trim(), contrasena);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="ingreso">
      <form className="tarjeta ingreso__formulario" onSubmit={enviar}>
        <h1>Administracion de usuarios e identidad</h1>
        <p className="ingreso__subtitulo">Institucion Educativa Distrital La Victoria</p>

        <label htmlFor="usuario">Usuario o correo institucional</label>
        <input
          id="usuario"
          type="text"
          autoComplete="username"
          value={usuario}
          onChange={(evento) => setUsuario(evento.target.value)}
          required
        />

        <label htmlFor="contrasena">Contrasena</label>
        <input
          id="contrasena"
          type="password"
          autoComplete="current-password"
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
          required
        />

        <Aviso tipo="error">{error}</Aviso>

        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? 'Verificando' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
