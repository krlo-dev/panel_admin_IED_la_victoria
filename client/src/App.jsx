import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import { ROLES } from './shared/roles.js';
import Ingresar from './pages/Ingresar.jsx';
import Inicio from './pages/Inicio.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Cursos from './pages/Cursos.jsx';
import DetalleCurso from './pages/DetalleCurso.jsx';
import CargaMasiva from './pages/CargaMasiva.jsx';
import CargarEstudiantes from './pages/CargarEstudiantes.jsx';
import Vigencias from './pages/Vigencias.jsx';
import Auditoria from './pages/Auditoria.jsx';
import SinPermisos from './pages/SinPermisos.jsx';
import NoEncontrado from './pages/NoEncontrado.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/ingresar" element={<Ingresar />} />

      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="sin-permisos" element={<SinPermisos />} />

          <Route element={<RutaProtegida roles={[ROLES.DOCENTE, ROLES.ADMINISTRADOR]} />}>
            <Route path="cursos" element={<Cursos />} />
            <Route path="cursos/:id" element={<DetalleCurso />} />
          </Route>

          <Route element={<RutaProtegida roles={[ROLES.ADMINISTRADOR]} />}>
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="carga-masiva" element={<CargaMasiva />} />
            <Route path="cargar-estudiantes" element={<CargarEstudiantes />} />
            <Route path="auditoria" element={<Auditoria />} />
            <Route path="vigencias" element={<Vigencias />} />
          </Route>

          <Route path="*" element={<NoEncontrado />} />
        </Route>
      </Route>
    </Routes>
  );
}
