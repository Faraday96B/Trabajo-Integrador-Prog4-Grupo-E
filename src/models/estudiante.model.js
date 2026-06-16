const pool = require('../db/pool');

const TABLE = 'public.estudiantes';

function buildFilters({ busqueda, documento, activo } = {}) {
  const where = [];
  const params = [];

  if (busqueda) {
    params.push(`%${busqueda}%`);
    where.push(`(
      e.documento ILIKE $${params.length}
      OR e.apellido ILIKE $${params.length}
      OR e.nombres ILIKE $${params.length}
      OR e.email ILIKE $${params.length}
    )`);
  }

  if (documento) {
    params.push(`%${documento}%`);
    where.push(`e.documento ILIKE $${params.length}`);
  }

  if (activo !== undefined && activo !== null && activo !== '') {
    params.push(Number(activo));
    where.push(`e.activo = $${params.length}`);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

function selectEstudianteBase() {
  return `
    SELECT
      e.*,
      u.nombre_usuario AS usuario_nombre_usuario,
      (
        SELECT COUNT(*)::int
        FROM public.inscripciones i
        WHERE i.id_estudiante = e.id_estudiante
          AND i.id_inscripcion_estado = 1
      ) AS inscripciones_confirmadas
    FROM ${TABLE} e
    INNER JOIN public.usuarios u
      ON u.id_usuario = e.id_usuario_modificacion
  `;
}

async function listar(filtros = {}) {
  const { whereSql, params } = buildFilters(filtros);
  const values = [...params];
  let limitOffsetSql = '';

  if (filtros.limit !== undefined && filtros.limit !== null && filtros.limit !== '') {
    values.push(Number(filtros.limit));
    limitOffsetSql += ` LIMIT $${values.length}`;
  }

  if (filtros.offset !== undefined && filtros.offset !== null && filtros.offset !== '') {
    values.push(Number(filtros.offset));
    limitOffsetSql += ` OFFSET $${values.length}`;
  }

  const sql = `
    ${selectEstudianteBase()}
    ${whereSql}
    ORDER BY e.apellido ASC, e.nombres ASC, e.id_estudiante DESC
    ${limitOffsetSql}
  `;

  const result = await pool.query(sql, values);
  return result.rows;
}

async function contar(filtros = {}) {
  const { whereSql, params } = buildFilters(filtros);
  const sql = `SELECT COUNT(*)::int AS total FROM ${TABLE} e ${whereSql}`;
  const result = await pool.query(sql, params);
  return result.rows[0]?.total ?? 0;
}

async function obtenerPorId(id_estudiante) {
  const sql = `
    ${selectEstudianteBase()}
    WHERE e.id_estudiante = $1
    LIMIT 1
  `;

  const result = await pool.query(sql, [id_estudiante]);
  return result.rows[0] ?? null;
}

async function crear({
  documento,
  apellido,
  nombres,
  email,
  fecha_nacimiento,
  activo = 1,
  id_usuario_modificacion,
}) {
  const sql = `
    INSERT INTO ${TABLE} (
      documento,
      apellido,
      nombres,
      email,
      fecha_nacimiento,
      activo,
      id_usuario_modificacion,
      fecha_hora_modificacion
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const result = await pool.query(sql, [
    documento,
    apellido,
    nombres,
    email,
    fecha_nacimiento,
    activo,
    id_usuario_modificacion,
    new Date(),
  ]);

  return result.rows[0] ?? null;
}

async function actualizar(id_estudiante, data = {}) {
  const campos = {
    documento: data.documento,
    apellido: data.apellido,
    nombres: data.nombres,
    email: data.email,
    fecha_nacimiento: data.fecha_nacimiento,
    activo: data.activo,
    id_usuario_modificacion: data.id_usuario_modificacion,
  };

  const sets = [];
  const values = [];

  for (const [campo, valor] of Object.entries(campos)) {
    if (valor !== undefined) {
      values.push(valor);
      sets.push(`${campo} = $${values.length}`);
    }
  }

  if (sets.length === 0) {
    return obtenerPorId(id_estudiante);
  }

  values.push(new Date());
  sets.push(`fecha_hora_modificacion = $${values.length}`);
  values.push(id_estudiante);

  const sql = `
    UPDATE ${TABLE}
    SET ${sets.join(', ')}
    WHERE id_estudiante = $${values.length}
    RETURNING *
  `;

  const result = await pool.query(sql, values);
  return result.rows[0] ?? null;
}

async function bajaLogica(id_estudiante, id_usuario_modificacion) {
  return actualizar(id_estudiante, {
    activo: 0,
    id_usuario_modificacion,
  });
}

async function existeDocumento(documento, excluirId = null) {
  const params = [documento];
  let whereSql = 'WHERE LOWER(documento) = LOWER($1)';

  if (excluirId !== null && excluirId !== undefined) {
    params.push(excluirId);
    whereSql += ' AND id_estudiante <> $2';
  }

  const sql = `SELECT 1 FROM ${TABLE} ${whereSql} LIMIT 1`;
  const result = await pool.query(sql, params);
  return result.rowCount > 0;
}

async function existeEmail(email, excluirId = null) {
  const params = [email];
  let whereSql = 'WHERE LOWER(email) = LOWER($1)';

  if (excluirId !== null && excluirId !== undefined) {
    params.push(excluirId);
    whereSql += ' AND id_estudiante <> $2';
  }

  const sql = `SELECT 1 FROM ${TABLE} ${whereSql} LIMIT 1`;
  const result = await pool.query(sql, params);
  return result.rowCount > 0;
}

module.exports = {
  listar,
  contar,
  obtenerPorId,
  crear,
  actualizar,
  bajaLogica,
  existeDocumento,
  existeEmail,
};
