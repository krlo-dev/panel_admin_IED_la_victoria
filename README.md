# Panel de Administración de Usuarios e Identidad

Módulo web de administración de usuarios e identidad para la Institución Educativa Distrital La Victoria. Corresponde al Proyecto C del diplomado y sirve como componente base de autenticación y control de acceso para los demás proyectos de la institución.

Universidad de la Costa, programa de Ingeniería de Sistemas. Luis Fuentes, Carlos Andrés Rodríguez Troncoso y Cesar Acosta.

## Organización del repositorio

```
panel_admin_IED_la_Victoria/
├── database/                   scripts SQL y plantilla de carga
│   ├── script.sql              modelo y datos del curso, fuente de verdad
│   ├── logs.sql                tabla de auditoría, aporte del grupo
│   └── plantilla_carga_masiva.csv
├── docker/
│   └── mysql/
│       └── 02_inicializacion.sh  carga logs.sql y otorga permisos
├── docker-compose.yml          servicio de MySQL 8.4
├── server/                     API REST con Express
└── client/                     SPA con React y Vite
```

El backend y el frontend son proyectos independientes: cada uno tiene su `package.json` y se instala y ejecuta por separado.

### Backend

```
server/
├── scripts/
│   └── cifrar-contrasenas.js   pasa a bcrypt las contraseñas del seed
└── src/
    ├── index.js                arranque, cierre ordenado y verificación de la base
    ├── app.js                  middlewares globales y montaje de rutas
    ├── config/                 variables de entorno y pool de MySQL
    ├── middlewares/            autenticar, autorizar, validar, vigencia, errores
    ├── shared/                 roles, estados, ids, token, respuestas y errores HTTP
    ├── routes/index.js         tabla de rutas de la API
    └── modules/                un módulo por requerimiento funcional
        ├── auth/
        ├── usuarios/
        ├── cursos/
        ├── asignaciones/
        ├── cargas/
        ├── vigencias/
        └── auditoria/
```

Cada módulo sigue la misma división, de afuera hacia adentro: `routes` declara los verbos y los permisos, `controller` traduce entre HTTP y el servicio, `service` contiene las reglas de negocio y las transacciones, `repository` es el único que escribe SQL y `schemas` define la validación de entrada con zod. Un módulo nunca consulta la base sin pasar por su repositorio, y las consultas siempre van parametrizadas.

### Frontend

```
client/
└── src/
    ├── main.jsx                punto de entrada, router y proveedor de sesión
    ├── App.jsx                 rutas y restricciones por rol
    ├── api/                    cliente HTTP, manejo del token y llamadas por módulo
    ├── context/                AuthContext y AuthProvider
    ├── hooks/useAuth.js        acceso a la sesión desde cualquier componente
    ├── components/             Layout, RutaProtegida, PermisoRol, Aviso, Cargando
    ├── pages/                  una página por módulo
    ├── shared/roles.js         nombres de rol, iguales a los de la base
    └── styles/global.css
```

## Requisitos

- Node.js 20 o superior
- Docker, o un MySQL 8 instalado en la máquina

## 1. Levantar la base de datos

Desde la raíz del repositorio:

```bash
docker compose up -d db
docker compose logs -f db
```

Cuando el log muestre `ready for connections` la base está lista. Se llama `bdiedlavictoria` y queda con las tablas y los datos de prueba del curso.

### Qué hace el compose

Levanta un contenedor de MySQL 8.4 llamado `iedlv-mysql`, con `utf8mb4` para que los acentos del script se guarden bien, y publica el puerto 3306. Los datos viven en el volumen `datos_mysql`, así que sobreviven a un `docker compose down`.

La carga inicial usa el mecanismo de MySQL: todo lo que se monte en `/docker-entrypoint-initdb.d` se ejecuta en orden alfabético la primera vez que se crea el volumen. El orden importa, porque `logs.sql` tiene una llave foránea hacia `usuario` y fallaría si corriera antes del modelo. Por eso el compose monta:

1. `database/script.sql` como `01_script.sql`, que crea la base, las tablas y los datos.
2. `docker/mysql/02_inicializacion.sh`, que carga `database/logs.sql` dentro de la base y le otorga permisos al usuario de la aplicación.

Los archivos de `database/` no se renombran en disco, el orden se define en el montaje.

### Variables del compose

| Variable | Valor por defecto |
| --- | --- |
| `MYSQL_PORT` | 3306 |
| `MYSQL_USER` | panel_admin |
| `MYSQL_PASSWORD` | panel_admin |
| `MYSQL_ROOT_PASSWORD` | root |

Si el puerto 3306 ya está ocupado por un MySQL local, levántelo en otro:

```bash
MYSQL_PORT=3307 docker compose up -d db
```

y ajuste `DB_PORT` en `server/.env`.

### Recargar la base desde cero

Los scripts de inicialización solo corren cuando el volumen se crea. Para volver al estado original hay que borrar el volumen:

```bash
docker compose down -v
docker compose up -d db
```

### Sin Docker

```bash
mysql -u root -p < database/script.sql
mysql -u root -p bdiedlavictoria < database/logs.sql
```

## 2. Levantar el backend

```bash
cd server
cp .env.example .env
npm install
npm run cifrar-seed
npm run dev
```

La API queda en http://localhost:4000/api y se puede comprobar con `curl http://localhost:4000/api/salud`.

`npm run cifrar-seed` recorre la tabla `usuario` y reemplaza por bcrypt las contraseñas que vienen en texto plano desde el script del curso. Se corre una sola vez por base de datos, no cambia las credenciales de ingreso y es obligatorio: sin ese paso el login responde que la contraseña no está cifrada.

### Variables de entorno

| Variable | Para qué sirve |
| --- | --- |
| `PORT` | Puerto de la API, 4000 por defecto |
| `CLIENT_ORIGIN` | Origen permitido por CORS, debe coincidir con la URL del cliente |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión a MySQL |
| `DB_POOL_LIMIT` | Conexiones máximas del pool |
| `JWT_SECRET` | Clave con la que se firman los tokens, obligatoria |
| `JWT_EXPIRA_EN` | Vigencia del token, 8h por defecto |
| `BCRYPT_ROUNDS` | Costo del hash, 10 por defecto |

`server/.env` no se versiona. Cada integrante crea el suyo a partir de `.env.example` y usa su propio `JWT_SECRET`.

## 3. Levantar el frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

El cliente queda en http://localhost:5173 y apunta a la API con `VITE_API_URL`.

## Credenciales de prueba

Vienen del script del curso y la contraseña de todas es `Temporal2026*`:

| Usuario | Rol |
| --- | --- |
| coordinador | Coordinador |
| docente1 a docente6 | Docente |
| est001 a est330 | Estudiante |

## Autenticación y autorización

El ingreso es local contra la tabla `usuario`: se valida con bcrypt y el servidor emite un JWT firmado con `JWT_SECRET`. El cliente lo guarda en `sessionStorage` y lo envía en el encabezado `Authorization`. Cada petición autenticada vuelve a leer el usuario en la base, de modo que un bloqueo tiene efecto inmediato sin esperar a que el token expire.

La contraseña inicial de un usuario nuevo es su número de documento, cifrada con bcrypt, según la RN01. El coordinador puede restablecerla a ese valor desde el listado de usuarios.

La tabla `rol` del modelo trae tres roles y el Coordinador es el rol tope, con las funciones de administración del módulo. El Coordinador conserva todos los permisos del Docente, que es la RN03.

| Rol | Alcance |
| --- | --- |
| Coordinador | Usuarios, asignación de docentes a cursos, carga masiva, vigencias y auditoría, más todo lo del rol docente |
| Docente | Consulta todos los cursos de la vigencia y administra únicamente los que tiene asignados |
| Estudiante | Consulta su propio perfil |

## Endpoints

| Método y ruta | Rol mínimo | Qué hace |
| --- | --- | --- |
| `GET /api/salud` | público | Estado del servicio |
| `POST /api/auth/login` | público | Valida credenciales y entrega el token |
| `GET /api/auth/perfil` | autenticado | Usuario, roles efectivos y vigencia activa |
| `POST /api/auth/contrasena` | autenticado | Cambio de contraseña propia |
| `POST /api/auth/cerrar-sesion` | autenticado | Registra el cierre en auditoría |
| `GET /api/usuarios` | Coordinador | Listado con búsqueda, rol, estado y curso |
| `GET /api/usuarios/:id` | Coordinador | Detalle de un usuario |
| `POST /api/usuarios` | Coordinador | Crea un usuario con contraseña inicial |
| `PATCH /api/usuarios/:id` | Coordinador | Actualiza nombre, apellido, correo o rol |
| `PATCH /api/usuarios/:id/estado` | Coordinador | Activa o bloquea |
| `POST /api/usuarios/:id/contrasena` | Coordinador | Restablece la contraseña al documento |
| `GET /api/cursos` | Docente | Cursos de la vigencia, con alcance por usuario |
| `GET /api/cursos/mios` | Docente | Cursos asignados al usuario |
| `GET /api/cursos/:id` | Docente | Detalle de un curso |
| `GET /api/asignaciones` | Docente | Docentes por curso en la vigencia |
| `POST /api/asignaciones` | Coordinador | Asigna un docente a un curso |
| `DELETE /api/asignaciones/:cursoId/:docenteId` | Coordinador | Retira la asignación |
| `GET /api/cargas/plantilla` | Coordinador | Descarga la plantilla CSV |
| `POST /api/cargas/usuarios` | Coordinador | Valida y carga estudiantes |
| `GET /api/vigencias` | Docente | Listado de años lectivos |
| `POST /api/vigencias` | Coordinador | Crea una vigencia |
| `PATCH /api/vigencias/:id/activar` | Coordinador | Cambia la vigencia activa |
| `GET /api/auditoria` | Coordinador | Registro de acciones |

Las consultas por vigencia aceptan `?anio=2026`. Sin ese parámetro responden con la vigencia activa, que es la RN06.

Las respuestas correctas llegan como `{ "data": ... }`, con `meta` cuando hay paginación. Los errores llegan como `{ "error": { "codigo", "mensaje", "detalles" } }`.

## Decisiones sobre el modelo de datos

`database/script.sql` es la fuente de verdad y no se modifica. El módulo se adaptó a ese esquema:

- La vigencia activa se lee de la tabla `configuracion`, clave `vigencia_activa`. Activar otra vigencia actualiza ese valor.
- El estado de un usuario es `id_estado`, con 1 Activo y 2 Bloqueado, en lugar de una bandera booleana.
- `curso` solo tiene `id` y `grado`. Los cursos de una vigencia se obtienen a través de `usuario_curso_vigencia`.
- El RF04 se interpreta como la relación de docentes con cursos que ya expresa `usuario_curso_vigencia`, sin limitarlo a un tutor único por curso.
- Ninguna llave primaria es `auto_increment`, así que cada inserción calcula su id con `MAX(id) + 1` dentro de la transacción.
- La carga masiva crea estudiantes y su matrícula en un solo movimiento. Si una fila falla no se crea ninguno, que es la RN07.

`database/logs.sql` es el aporte del grupo y quedó ampliado con `accion`, `entidad`, `id_entidad` y `fecha`, que es lo que necesita el RF07. La columna `mistake` se conserva y guarda el detalle de la operación.

## Solución de problemas

**El login responde que la contraseña no está cifrada.** Falta correr `npm run cifrar-seed` en `server/`.

**El servidor no arranca y dice que no fue posible iniciar.** El arranque verifica la conexión a MySQL antes de escuchar. Revise que el contenedor esté arriba con `docker compose ps` y que `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` en `server/.env` correspondan.

**Variable de entorno requerida sin valor.** Falta `server/.env`, o le falta `JWT_SECRET`, `DB_USER` o `DB_NAME`.

**El contenedor levanta pero la base está vacía.** Los scripts solo corren al crear el volumen. Use `docker compose down -v` y vuelva a levantar.

**El navegador reporta un error de CORS.** `CLIENT_ORIGIN` en `server/.env` debe ser exactamente la URL del cliente, incluido el puerto.

**Un error de rollup o esbuild al construir el cliente.** Los binarios instalados no corresponden al sistema operativo actual, algo que pasa al compartir la carpeta entre Windows y Linux. Borre `client/node_modules` y vuelva a correr `npm install` en el sistema donde va a trabajar.

## Pendientes

- Mensajes de validación de zod en español, para cumplir el RNF04.
- Vista de perfil para el rol Estudiante.
- Pruebas funcionales y de control de acceso por rol.
- Definir la extracción desde Sian365 para poblar la base, que es la RN09.
