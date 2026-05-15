# Trabajo-Integrador-Prog4-Grupo-E

Proyecto en Node.js + PostgreSQL para el sistema de inscripcion a cursos.

## Configuracion local

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env` tomando como base `.env.example`.

3. Crear o actualizar la base de datos local:

```bash
npm run db:init
```

4. Iniciar la aplicacion:

```bash
npm start
```

## Scripts

- `npm start`: inicia el servidor Express.
- `npm run dev`: inicia el servidor Express.
- `npm run db:init`: crea la base configurada en `.env` si no existe y aplica tablas/datos iniciales sin borrar datos existentes.

## Estructura

- `public/`: frontend
- `src/`: backend
- `database/`: scripts SQL de inicializacion
- `scripts/`: scripts auxiliares del proyecto
- `.env.example`: variables de entorno de referencia
- `package.json`: dependencias y scripts
