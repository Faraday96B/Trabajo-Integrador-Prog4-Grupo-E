# Trabajo Integrador Programacion 4 - Grupo E

Sistema web para la gestion de inscripciones a cursos de FCAD - UNER.

El proyecto incluye un backend en Node.js con Express y PostgreSQL, y un frontend administrativo estatico construido con HTML, CSS, Bootstrap y JavaScript vanilla.

## Funcionalidades

- Autenticacion de usuarios con JWT.
- Login, logout y validacion de sesion.
- Dashboard administrativo con metricas generales.
- Gestion de cursos: listado, filtros, alta, edicion, detalle, baja logica y diploma PDF.
- Gestion de estudiantes: listado, filtros, alta, edicion, detalle y baja logica.
- Gestion de inscripciones: listado, filtros, alta, detalle, cancelacion y diploma PDF.
- Filtros y paginacion en los listados principales.
- Generacion de certificados/diplomas en PDF con Handlebars y Puppeteer.
- Frontend responsive para escritorio y dispositivos moviles.

## Stack Tecnico

- Node.js
- Express
- PostgreSQL
- Passport
- JSON Web Token
- express-validator
- Handlebars
- Puppeteer
- Bootstrap
- JavaScript vanilla

## Configuracion Local

1. Instalar dependencias:

```bash
npm install
```

2. Crear un archivo `.env` tomando como base `.env.example`.

3. Configurar las variables de entorno de PostgreSQL y JWT:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=trabajo_integrador
DB_ADMIN_DATABASE=postgres

JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=2h
```

4. Crear o actualizar la base de datos local:

```bash
npm run db:init
```

5. Iniciar la aplicacion:

```bash
npm start
```

6. Abrir la aplicacion en el navegador:

```txt
http://localhost:3000
```

La ruta raiz redirige al dashboard administrativo.

## Scripts

- `npm start`: inicia el servidor Express.
- `npm run dev`: inicia el servidor Express.
- `npm run db:init`: crea la base configurada en `.env` si no existe y aplica tablas/datos iniciales sin borrar datos existentes.

## Estructura Del Proyecto

```txt
public/
  pages/          Paginas HTML del frontend administrativo
  js/             Logica frontend por pagina y utilidades compartidas
  css/            Estilos propios y Bootstrap
  assets/         Imagenes e iconos

src/
  app.js          Configuracion principal de Express
  config/         Configuracion de entorno y JWT
  controllers/    Controladores HTTP
  db/             Pool de conexion a PostgreSQL
  dtos/           Transformacion de datos entre base/API/frontend
  middleware/     Autenticacion, validacion y manejo de errores
  models/         Consultas SQL y acceso a datos
  routes/         Definicion de endpoints
  services/       Reglas de negocio
  templates/      Plantillas Handlebars para PDFs
  utils/          Helpers, constantes y paginacion
  validators/     Validaciones de requests

database/         Script SQL de inicializacion
scripts/          Scripts auxiliares del proyecto
doc/              Documentacion de la entrega
```

## Frontend

El frontend se sirve desde `public/` mediante `express.static`.

Paginas principales:

- `/pages/login.html`: inicio de sesion.
- `/pages/dashboard.html`: resumen general del sistema.
- `/pages/cursos.html`: listado y gestion de cursos.
- `/pages/curso-form.html`: alta y edicion de cursos.
- `/pages/curso-detalle.html`: detalle de un curso.
- `/pages/estudiantes.html`: listado y gestion de estudiantes.
- `/pages/inscripciones.html`: listado, alta y gestion de inscripciones.
- `/pages/perfil.html`: informacion del usuario autenticado.

Archivos JavaScript principales:

- `public/js/api.js`: helper comun para llamadas a la API, manejo de token JWT y redireccion por sesion expirada.
- `public/js/auth.js`: login, logout, validacion de sesion y datos del usuario autenticado.
- `public/js/dashboard.js`: carga de metricas y tablas del dashboard.
- `public/js/cursos.js`: filtros, tabla, paginacion, formulario, detalle y diplomas de cursos.
- `public/js/estudiantes.js`: filtros, tabla, paginacion, formulario, detalle y baja logica de estudiantes.
- `public/js/inscripciones.js`: filtros, alta, tabla, paginacion, detalle, cancelacion y diplomas de inscripciones.
- `public/js/perfil.js`: datos del perfil del usuario.

## Backend

La arquitectura del backend esta organizada por capas:

```txt
routes -> controllers -> services -> models -> database
```

- `routes`: definen los endpoints disponibles.
- `controllers`: reciben la request y devuelven la response.
- `services`: contienen reglas de negocio.
- `models`: ejecutan consultas contra PostgreSQL.
- `dtos`: adaptan datos entre la base de datos, la API y el frontend.
- `validators`: validan parametros, query strings y bodies.
- `middleware`: protege rutas con JWT y centraliza validaciones.

Las rutas de cursos, estudiantes e inscripciones estan protegidas con JWT. La autenticacion se realiza con Passport y el token se envia desde el frontend mediante el header:

```txt
Authorization: Bearer <token>
```

## Endpoints Principales

### Autenticacion

- `POST /api/auth/login`: inicia sesion y devuelve token JWT.
- `GET /api/auth/me`: devuelve el usuario autenticado.
- `POST /api/auth/logout`: endpoint de cierre de sesion.

### Cursos

- `GET /api/cursos`: listado de cursos con filtros.
- `GET /api/cursos/:id`: detalle de un curso.
- `POST /api/cursos`: alta de curso.
- `PUT /api/cursos/:id`: actualizacion de curso.
- `DELETE /api/cursos/:id`: baja logica de curso.
- `GET /api/cursos/:id/diploma`: certificado PDF del curso.

### Estudiantes

- `GET /api/estudiantes`: listado de estudiantes con filtros y paginacion.
- `GET /api/estudiantes/:id`: detalle de un estudiante.
- `POST /api/estudiantes`: alta de estudiante.
- `PUT /api/estudiantes/:id`: actualizacion de estudiante.
- `DELETE /api/estudiantes/:id`: baja logica de estudiante.

### Inscripciones

- `GET /api/inscripciones`: listado de inscripciones con filtros y paginacion.
- `GET /api/inscripciones/opciones`: datos auxiliares para crear inscripciones.
- `POST /api/inscripciones`: alta de inscripcion.
- `GET /api/inscripciones/:id`: detalle de una inscripcion.
- `DELETE /api/inscripciones/:id`: cancelacion de inscripcion.
- `GET /api/inscripciones/:id/diploma`: diploma individual en PDF.

## Base De Datos

El script `npm run db:init` ejecuta `scripts/init-db.js`, que realiza estas tareas:

- Verifica las variables de entorno necesarias.
- Crea la base definida en `DB_NAME` si no existe.
- Ejecuta `database/init.sql`.
- Crea tablas, indices y datos iniciales.
- Actualiza las secuencias de las tablas.

El SQL usa `CREATE TABLE IF NOT EXISTS` y `ON CONFLICT DO NOTHING`, por lo que no borra datos existentes al ejecutarse nuevamente.

Tablas principales:

- `usuarios`
- `cursos`
- `cursos_estados`
- `estudiantes`
- `inscripciones`
- `inscripciones_estados`

## Respuestas De La API

Las respuestas JSON siguen una estructura general:

```json
{
  "ok": true,
  "message": "Operacion realizada correctamente.",
  "data": {}
}
```

En listados paginados tambien puede incluirse informacion en `meta`.

```json
{
  "ok": true,
  "message": "Listado obtenido correctamente.",
  "data": [],
  "meta": {
    "pagina": 1,
    "limite": 10,
    "total": 0,
    "totalPaginas": 1
  }
}
```

## Notas

- El frontend guarda el JWT en `localStorage` bajo la clave `token`.
- Los datos del usuario autenticado se guardan en `localStorage` bajo la clave `usuario`.
- Si una request protegida devuelve `401`, el frontend limpia la sesion y redirige a `/pages/login.html`.
- Las bajas de cursos, estudiantes e inscripciones son logicas, no eliminaciones fisicas directas.
