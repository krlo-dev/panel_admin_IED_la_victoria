import { useCallback, useEffect, useState } from 'react';
import { cambiarEstadoUsuario, listarUsuarios, restablecerContrasena } from '../api/usuarios.js';
import Aviso from '../components/Aviso.jsx';
import Cargando from '../components/Cargando.jsx';

export default function Usuarios() {
  const [registros, setRegistros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const consultar = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const respuesta = await listarUsuarios({ busqueda, limite: 50 });
      setRegistros(respuesta.data);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }, [busqueda]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  const alternarEstado = async (usuario) => {
    setMensaje(null);
    try {
      await cambiarEstadoUsuario(usuario.id, usuario.estado !== 'Activo');
      await consultar();
    } catch (fallo) {
      setError(fallo.message);
    }
  };

  const restablecer = async (usuario) => {
    setError(null);
    try {
      await restablecerContrasena(usuario.id);
      setMensaje(`La contrasena de ${usuario.usuario} quedo en su numero de documento`);
    } catch (fallo) {
      setError(fallo.message);
    }
  };

  return (
    <section className="seccion">
      <header className="seccion__encabezado">
        <h1>Usuarios</h1>
        <input
          type="search"
          placeholder="Buscar por nombre, identificacion o usuario"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />
      </header>

      <Aviso tipo="error">{error}</Aviso>
      <Aviso tipo="exito">{mensaje}</Aviso>

      {cargando ? (
        <Cargando mensaje="Consultando usuarios" />
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Identificacion</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {registros.map((registro) => (
              <tr key={registro.id}>
                <td>{registro.usuario}</td>
                <td>{registro.identificacion}</td>
                <td>{`${registro.apellido} ${registro.nombre}`}</td>
                <td>{registro.rol}</td>
                <td>{registro.estado}</td>
                <td className="tabla__acciones">
                  <button type="button" className="boton boton--claro" onClick={() => alternarEstado(registro)}>
                    {registro.estado === 'Activo' ? 'Bloquear' : 'Activar'}
                  </button>
                  <button type="button" className="boton boton--claro" onClick={() => restablecer(registro)}>
                    Restablecer clave
                  </button>
                </td>
              </tr>
            ))}
            {registros.length === 0 && (
              <tr>
                <td colSpan={6}>No hay usuarios para los filtros aplicados</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
