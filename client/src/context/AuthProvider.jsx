import { useCallback, useEffect, useMemo, useState } from 'react';
import * as auth from '../api/auth.js';
import { borrarToken, guardarToken, obtenerToken } from '../api/sesion.js';
import AuthContext from './AuthContext.js';

export default function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!obtenerToken()) {
      setCargando(false);
      return;
    }

    auth
      .perfil()
      .then((respuesta) => setSesion(respuesta.data))
      .catch(() => {
        borrarToken();
        setSesion(null);
      })
      .finally(() => setCargando(false));
  }, []);

  const iniciarSesion = useCallback(async (usuario, contrasena) => {
    setError(null);
    const respuesta = await auth.login(usuario, contrasena);
    guardarToken(respuesta.data.token);

    const perfil = await auth.perfil();
    setSesion(perfil.data);
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await auth.cerrarSesion();
    } catch {
      setError(null);
    } finally {
      borrarToken();
      setSesion(null);
    }
  }, []);

  const valor = useMemo(
    () => ({
      usuario: sesion?.usuario ?? null,
      rol: sesion?.usuario?.rol ?? null,
      rolesEfectivos: sesion?.rolesEfectivos ?? [],
      vigencia: sesion?.vigencia ?? null,
      autenticado: Boolean(sesion),
      cargando,
      error,
      iniciarSesion,
      cerrarSesion
    }),
    [sesion, cargando, error, iniciarSesion, cerrarSesion]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
