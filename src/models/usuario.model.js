const pool = require('../db/pool');

function mapUsuario(row) {
  if (!row) {
    return null;
  }

  return {
    idUsuario: row.id_usuario,
    apellido: row.apellido,
    nombre: row.nombre,
    nombreUsuario: row.nombre_usuario,
    contrasenia: row.contrasenia,
    activo: Boolean(Number(row.activo)),
  };
}

async function obtenerPorNombreUsuario(nombreUsuario) {
  const sql = `
    SELECT id_usuario, apellido, nombre, nombre_usuario, contrasenia, activo
    FROM public.usuarios
    WHERE nombre_usuario = $1
    LIMIT 1
  `;

  const result = await pool.query(sql, [nombreUsuario]);
  return mapUsuario(result.rows[0] ?? null);
}

async function obtenerActivoPorId(idUsuario) {
  const sql = `
    SELECT id_usuario, apellido, nombre, nombre_usuario, contrasenia, activo
    FROM public.usuarios
    WHERE id_usuario = $1
      AND activo = 1
    LIMIT 1
  `;

  const result = await pool.query(sql, [idUsuario]);
  return mapUsuario(result.rows[0] ?? null);
}

module.exports = {
  obtenerPorNombreUsuario,
  obtenerActivoPorId,
};
