require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_NAME'];

function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }
}

function assertDatabaseName(name) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error('DB_NAME solo puede contener letras, numeros y guiones bajos para crear la base automaticamente.');
  }
}

function createPool(database) {
  return new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database,
  });
}

async function ensureDatabaseExists() {
  const databaseName = process.env.DB_NAME;
  assertDatabaseName(databaseName);

  const adminDatabase = process.env.DB_ADMIN_DATABASE || 'postgres';
  const pool = createPool(adminDatabase);

  try {
    const result = await pool.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);

    if (result.rowCount === 0) {
      await pool.query(`CREATE DATABASE ${databaseName}`);
      console.log(`Base de datos creada: ${databaseName}`);
    } else {
      console.log(`Base de datos existente: ${databaseName}`);
    }
  } finally {
    await pool.end();
  }
}

async function runInitSql() {
  const sqlPath = path.join(__dirname, '..', 'database', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const pool = createPool(process.env.DB_NAME);

  try {
    await pool.query(sql);
    console.log('Tablas y datos iniciales verificados correctamente.');
  } finally {
    await pool.end();
  }
}

async function main() {
  assertEnv();
  await ensureDatabaseExists();
  await runInitSql();
}

main().catch((error) => {
  console.error(`Error inicializando la base de datos: ${error.message}`);
  process.exit(1);
});
