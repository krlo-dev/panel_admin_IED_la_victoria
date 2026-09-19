import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Aviso from '../components/Aviso.jsx';
import { IconoOjo, IconoOjoCerrado, IconoAuriculares } from '../components/Iconos.jsx';
import logo from '../assets/logo.png';
import sedePrincipal from '../assets/sede-principal.jpg';
import { MODO_DEMO } from '../api/cliente.js';

export default function Ingresar() {
  const { autenticado, iniciarSesion } = useAuth();
  const ubicacion = useLocation();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verClave, setVerClave] = useState(false);
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
      <section className="ingreso__panel-visual">
        <div className="ingreso__marca">
          <img src={logo} alt="Escudo IED La Victoria" />
          <div>
            <p className="ingreso__marca-distrito">Distrito de Barranquilla</p>
            <p className="ingreso__marca-nombre">IED La Victoria</p>
          </div>
        </div>

        <div className="ingreso__mensaje">
          <h2>Portal de acceso institucional</h2>
          <p>
            Un solo lugar para ingresar a los servicios en linea de la Institucion Educativa Distrital
            La Victoria, con su usuario y contrasena institucional.
          </p>
        </div>

        <div className="ingreso__foto">
          <span className="ingreso__foto-etiqueta">Jornada continua</span>
          <img src={sedePrincipal} alt="Sede principal de la IED La Victoria" />
          <div className="ingreso__foto-pie">
            <strong>Sede Principal</strong>
            <span>Barranquilla, Atlantico</span>
          </div>
        </div>
      </section>

      <section className="ingreso__panel-formulario">
        <form className="ingreso__formulario" onSubmit={enviar}>
          <h1>Acceso institucional</h1>
          <p className="ingreso__subtitulo">Ingrese con su usuario y contrasena institucional.</p>

          <div className="campo">
            <label htmlFor="usuario">Usuario o correo institucional</label>
            <input
              id="usuario"
              type="text"
              autoComplete="username"
              value={usuario}
              onChange={(evento) => setUsuario(evento.target.value)}
              placeholder="Ej. admin"
              required
            />
          </div>

          <div className="campo">
            <div className="ingreso__campo-cabecera">
              <label htmlFor="contrasena">Contrasena de acceso</label>
              <a className="ingreso__enlace" href="mailto:soporte@iedlavictoria.edu.co">
                ¿Olvido su clave?
              </a>
            </div>
            <div className="ingreso__campo-contrasena">
              <input
                id="contrasena"
                type={verClave ? 'text' : 'password'}
                autoComplete="current-password"
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
                required
              />
              <button
                type="button"
                className="ingreso__alternar-clave"
                onClick={() => setVerClave((valor) => !valor)}
                aria-label={verClave ? 'Ocultar contrasena' : 'Mostrar contrasena'}
              >
                {verClave ? <IconoOjoCerrado width={18} height={18} /> : <IconoOjo width={18} height={18} />}
              </button>
            </div>
          </div>

          <Aviso tipo="error">{error}</Aviso>

          {MODO_DEMO && (
            <div className="aviso aviso--advertencia ingreso__nota">
              <span>
                <strong>Modo demo (sin backend):</strong> use <code>admin</code> con cualquier contrasena.
              </span>
            </div>
          )}

          <button type="submit" className="boton boton--ancho" disabled={enviando}>
            {enviando ? 'Verificando...' : 'Ingresar al sistema'}
          </button>

          <div className="aviso aviso--info ingreso__nota">
            <IconoAuriculares width={18} height={18} />
            <span>
              <strong>Primer ingreso:</strong> su contrasena provisional corresponde a su numero de
              identificacion registrado.
            </span>
          </div>

          <p className="ingreso__pie">
            Cumplimiento Ley Estatutaria 1581 de 2012 de Proteccion de Datos Personales (Habeas Data
            Escolar) y Decreto 1377 de 2013.
            <br />
            Secretaria Academica IED La Victoria · soporte@iedlavictoria.edu.co
          </p>
        </form>
      </section>
    </div>
  );
}
