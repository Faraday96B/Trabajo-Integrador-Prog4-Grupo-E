const pool = require('../db/pool');

const TABLE = 'public.cursos';

function buildFilters({ nombre, estado, fechaDesde, fechaHasta } = {}) {
  const where = [];
  const params = [];

  if (nombre) {
    params.push(`%${nombre}%`);
    where.push(`c.nombre ILIKE $${params.length}`);
  }

  if (estado !== undefined && estado !== null && estado !== '') {
    params.push(Number(estado));
    where.push(`c.id_curso_estado = $${params.length}`);
  }

  if (fechaDesde) {
    params.push(fechaDesde);
    where.push(`c.fecha_inicio >= $${params.length}`);
  }

  if (fechaHasta) {
    params.push(fechaHasta);
    where.push(`c.fecha_inicio <= $${params.length}`);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

function mapCursoRow(row) {
  if (!row) {
    return null;
  }

  return {
    id_curso: row.id_curso,
    nombre: row.nombre,
    descripcion: row.descripcion,
    fecha_inicio: row.fecha_inicio,
    cantidad_horas: row.cantidad_horas,
    inscriptos_max: row.inscriptos_max,
    id_curso_estado: row.id_curso_estado,
    curso_estado_descripcion: row.curso_estado_descripcion,
    curso_estado_es_activo: row.curso_estado_es_activo,
    id_usuario_modificacion: row.id_usuario_modificacion,
    usuario_nombre_usuario: row.usuario_nombre_usuario,
    fecha_hora_modificacion: row.fecha_hora_modificacion,
    inscriptos_confirmados: Number(row.inscriptos_confirmados ?? 0),
  };
}

async function listar({ nombre, estado, fechaDesde, fechaHasta, limit, offset } = {}) {
  const { whereSql, params } = buildFilters({ nombre, estado, fechaDesde, fechaHasta });
  const sql = `
    SELECT
      c.*,
      ce.descripcion AS curso_estado_descripcion,
      ce.es_activo AS curso_estado_es_activo,
      u.nombre_usuario AS usuario_nombre_usuario,
      (
        SELECT COUNT(*)
        FROM public.inscripciones i
        WHERE i.id_curso = c.id_curso
          AND i.id_inscripcion_estado = 1
      ) AS inscriptos_confirmados
    FROM ${TABLE} c
    INNER JOIN public.cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
    INNER JOIN public.usuarios u ON u.id_usuario = c.id_usuario_modificacion
    ${whereSql}
    ORDER BY c.id_curso DESC
    ${limit !== undefined && limit !== null && limit !== '' ? `LIMIT ${Number(limit)}` : ''}
    ${offset !== undefined && offset !== null && offset !== '' ? `OFFSET ${Number(offset)}` : ''}
  `;

  const result = await pool.query(sql, params);
  return result.rows.map(mapCursoRow);
}

async function contar({ nombre, estado, fechaDesde, fechaHasta } = {}) {
  const { whereSql, params } = buildFilters({ nombre, estado, fechaDesde, fechaHasta });
  const sql = `SELECT COUNT(*)::int AS total FROM ${TABLE} c INNER JOIN public.cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado ${whereSql}`;
  const result = await pool.query(sql, params);
  return result.rows[0]?.total ?? 0;
}

async function obtenerPorId(id_curso) {
  const sql = `
    SELECT
      c.*,
      ce.descripcion AS curso_estado_descripcion,
      ce.es_activo AS curso_estado_es_activo,
      u.nombre_usuario AS usuario_nombre_usuario,
      (
        SELECT COUNT(*)
        FROM public.inscripciones i
        WHERE i.id_curso = c.id_curso
          AND i.id_inscripcion_estado = 1
      ) AS inscriptos_confirmados
    FROM ${TABLE} c
    INNER JOIN public.cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
    INNER JOIN public.usuarios u ON u.id_usuario = c.id_usuario_modificacion
    WHERE c.id_curso = $1
    LIMIT 1
  `;

  const result = await pool.query(sql, [id_curso]);
  return mapCursoRow(result.rows[0] ?? null);
}

async function obtenerActivos() {
  const sql = `
    SELECT
      c.*,
      ce.descripcion AS curso_estado_descripcion,
      ce.es_activo AS curso_estado_es_activo
    FROM ${TABLE} c
    INNER JOIN public.cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
    WHERE ce.es_activo = 1
      AND c.id_curso_estado <> 4
    ORDER BY c.nombre ASC
  `;

  const result = await pool.query(sql);
  return result.rows.map(mapCursoRow);
}

async function obtenerParaDiploma(id_curso) {
  const sql = `
    SELECT
      c.id_curso,
      c.nombre,
      c.descripcion,
      c.fecha_inicio,
      c.cantidad_horas,
      ce.descripcion AS curso_estado_descripcion
    FROM ${TABLE} c
    INNER JOIN public.cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
    WHERE c.id_curso = $1
    LIMIT 1
  `;

  const result = await pool.query(sql, [id_curso]);
  return result.rows[0] ?? null;
}

async function crear({
  nombre,
  descripcion,
  fecha_inicio,
  cantidad_horas,
  inscriptos_max,
  id_curso_estado = 1,
  id_usuario_modificacion,
}) {
  const sql = `
    INSERT INTO ${TABLE} (
      nombre,
      descripcion,
      fecha_inicio,
      cantidad_horas,
      inscriptos_max,
      id_curso_estado,
      id_usuario_modificacion,
      fecha_hora_modificacion
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const result = await pool.query(sql, [
    nombre,
    descripcion,
    fecha_inicio,
    cantidad_horas,
    inscriptos_max,
    id_curso_estado,
    id_usuario_modificacion,
    new Date(),
  ]);

  return result.rows[0] ?? null;
}

async function actualizar(id_curso, data = {}) {
  const campos = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    fecha_inicio: data.fecha_inicio,
    cantidad_horas: data.cantidad_horas,
    inscriptos_max: data.inscriptos_max,
    id_curso_estado: data.id_curso_estado,
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
    return obtenerPorId(id_curso);
  }

  values.push(new Date());
  sets.push(`fecha_hora_modificacion = $${values.length}`);

  values.push(id_curso);

  const sql = `
    UPDATE ${TABLE}
    SET ${sets.join(', ')}
    WHERE id_curso = $${values.length}
    RETURNING *
  `;

  const result = await pool.query(sql, values);

  return result.rows[0] ?? null;
}

async function cambiarEstado(id_curso, id_curso_estado, id_usuario_modificacion) {
  const sql = `
    UPDATE ${TABLE}
    SET id_curso_estado = $2,
        id_usuario_modificacion = $3,
        fecha_hora_modificacion = $4
    WHERE id_curso = $1
    RETURNING *
  `;

  const result = await pool.query(sql, [
    id_curso,
    id_curso_estado,
    id_usuario_modificacion,
    new Date(),
  ]);

  return result.rows[0] ?? null;
}

async function bajaLogica(id_curso, id_usuario_modificacion) {
  return cambiarEstado(id_curso, 4, id_usuario_modificacion);
}

async function existeNombre(nombre, excluirId = null) {
  const params = [nombre];
  let whereSql = 'WHERE LOWER(nombre) = LOWER($1) AND id_curso_estado <> 4';

  if (excluirId !== null && excluirId !== undefined) {
    params.push(excluirId);
    whereSql += ' AND id_curso <> $2';
  }

  const sql = `SELECT 1 FROM ${TABLE} ${whereSql} LIMIT 1`;
  const result = await pool.query(sql, params);
  return result.rowCount > 0;
}

async function obtenerCupo(id_curso) {
  const sql = `
    SELECT
      c.id_curso,
      c.inscriptos_max,
      COUNT(i.id_inscripcion)::int AS inscriptos_confirmados
    FROM ${TABLE} c
    LEFT JOIN public.inscripciones i
      ON i.id_curso = c.id_curso
     AND i.id_inscripcion_estado = 1
    WHERE c.id_curso = $1
    GROUP BY c.id_curso, c.inscriptos_max
    LIMIT 1
  `;

  const result = await pool.query(sql, [id_curso]);
  return result.rows[0] ?? null;
}

module.exports = {
  listar,
  contar,
  obtenerPorId,
  obtenerActivos,
  obtenerParaDiploma,
  crear,
  actualizar,
  cambiarEstado,
  bajaLogica,
  existeNombre,
  obtenerCupo,
};
