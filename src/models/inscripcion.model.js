const pool = require('../db/pool');

const TABLE = 'public.inscripciones';
const ESTADO_CONFIRMADA = 1;
const ESTADO_CANCELADA = 2;

function buildFilters({
  idCurso,
  idEstudiante,
  estado,
  documento,
  busqueda,
  fechaDesde,
  fechaHasta,
} = {}) {
  const where = [];
  const params = [];

  if (idCurso !== undefined && idCurso !== null && idCurso !== '') {
    params.push(Number(idCurso));
    where.push(`i.id_curso = $${params.length}`);
  }

  if (idEstudiante !== undefined && idEstudiante !== null && idEstudiante !== '') {
    params.push(Number(idEstudiante));
    where.push(`i.id_estudiante = $${params.length}`);
  }

  if (estado !== undefined && estado !== null && estado !== '') {
    params.push(Number(estado));
    where.push(`i.id_inscripcion_estado = $${params.length}`);
  }

  if (documento) {
    params.push(`%${documento}%`);
    where.push(`e.documento ILIKE $${params.length}`);
  }

  if (busqueda) {
    params.push(`%${busqueda}%`);
    where.push(`(
      e.documento ILIKE $${params.length}
      OR e.apellido ILIKE $${params.length}
      OR e.nombres ILIKE $${params.length}
      OR c.nombre ILIKE $${params.length}
    )`);
  }

  if (fechaDesde) {
    params.push(fechaDesde);
    where.push(`i.fecha_hora_inscripcion::date >= $${params.length}`);
  }

  if (fechaHasta) {
    params.push(fechaHasta);
    where.push(`i.fecha_hora_inscripcion::date <= $${params.length}`);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

function selectInscripcionBase() {
  return `
    SELECT
      i.*,
      ie.descripcion AS inscripcion_estado_descripcion,
      ie.es_activo AS inscripcion_estado_es_activo,
      c.nombre AS curso_nombre,
      c.fecha_inicio AS curso_fecha_inicio,
      c.cantidad_horas AS curso_cantidad_horas,
      c.inscriptos_max AS curso_inscriptos_max,
      c.id_curso_estado,
      ce.descripcion AS curso_estado_descripcion,
      e.documento AS estudiante_documento,
      e.apellido AS estudiante_apellido,
      e.nombres AS estudiante_nombres,
      e.email AS estudiante_email,
      e.activo AS estudiante_activo,
      u.nombre_usuario AS usuario_nombre_usuario
    FROM ${TABLE} i
    INNER JOIN public.inscripciones_estados ie
      ON ie.id_inscripcion_estado = i.id_inscripcion_estado
    INNER JOIN public.cursos c
      ON c.id_curso = i.id_curso
    INNER JOIN public.cursos_estados ce
      ON ce.id_curso_estado = c.id_curso_estado
    INNER JOIN public.estudiantes e
      ON e.id_estudiante = i.id_estudiante
    INNER JOIN public.usuarios u
      ON u.id_usuario = i.id_usuario_modificacion
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
    ${selectInscripcionBase()}
    ${whereSql}
    ORDER BY i.fecha_hora_inscripcion DESC, i.id_inscripcion DESC
    ${limitOffsetSql}
  `;

  const result = await pool.query(sql, values);
  return result.rows;
}

async function contar(filtros = {}) {
  const { whereSql, params } = buildFilters(filtros);
  const sql = `
    SELECT COUNT(*)::int AS total
    FROM ${TABLE} i
    INNER JOIN public.cursos c ON c.id_curso = i.id_curso
    INNER JOIN public.estudiantes e ON e.id_estudiante = i.id_estudiante
    ${whereSql}
  `;

  const result = await pool.query(sql, params);
  return result.rows[0]?.total ?? 0;
}

async function obtenerPorId(id_inscripcion) {
  const sql = `
    ${selectInscripcionBase()}
    WHERE i.id_inscripcion = $1
    LIMIT 1
  `;

  const result = await pool.query(sql, [id_inscripcion]);
  return result.rows[0] ?? null;
}

async function obtenerEstudiantePorId(id_estudiante) {
  const sql = `
    SELECT id_estudiante, documento, apellido, nombres, email, fecha_nacimiento, activo
    FROM public.estudiantes
    WHERE id_estudiante = $1
    LIMIT 1
  `;

  const result = await pool.query(sql, [id_estudiante]);
  return result.rows[0] ?? null;
}

async function listarEstudiantesActivos() {
  const sql = `
    SELECT id_estudiante, documento, apellido, nombres, email
    FROM public.estudiantes
    WHERE activo = 1
    ORDER BY apellido ASC, nombres ASC
  `;

  const result = await pool.query(sql);
  return result.rows;
}

async function existeConfirmada(id_curso, id_estudiante) {
  const sql = `
    SELECT 1
    FROM ${TABLE}
    WHERE id_curso = $1
      AND id_estudiante = $2
      AND id_inscripcion_estado = $3
    LIMIT 1
  `;

  const result = await pool.query(sql, [id_curso, id_estudiante, ESTADO_CONFIRMADA]);
  return result.rowCount > 0;
}

async function crear({ id_curso, id_estudiante, id_usuario_modificacion }) {
  const sql = `
    INSERT INTO ${TABLE} (
      id_curso,
      id_estudiante,
      fecha_hora_inscripcion,
      id_inscripcion_estado,
      id_usuario_modificacion,
      fecha_hora_modificacion
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const ahora = new Date();

  const result = await pool.query(sql, [
    id_curso,
    id_estudiante,
    ahora,
    ESTADO_CONFIRMADA,
    id_usuario_modificacion,
    ahora,
  ]);

  return result.rows[0] ?? null;
}

async function cambiarEstado(id_inscripcion, id_inscripcion_estado, id_usuario_modificacion) {
  const sql = `
    UPDATE ${TABLE}
    SET id_inscripcion_estado = $2,
        id_usuario_modificacion = $3,
        fecha_hora_modificacion = $4
    WHERE id_inscripcion = $1
    RETURNING *
  `;

  const result = await pool.query(sql, [
    id_inscripcion,
    id_inscripcion_estado,
    id_usuario_modificacion,
    new Date(),
  ]);

  return result.rows[0] ?? null;
}

async function cancelar(id_inscripcion, id_usuario_modificacion) {
  return cambiarEstado(id_inscripcion, ESTADO_CANCELADA, id_usuario_modificacion);
}

async function listarCursosAbiertos() {
  const sql = `
    SELECT
      c.id_curso,
      c.nombre,
      c.fecha_inicio,
      c.cantidad_horas,
      c.inscriptos_max,
      (
        SELECT COUNT(*)::int
        FROM public.inscripciones i
        WHERE i.id_curso = c.id_curso
          AND i.id_inscripcion_estado = $1
      ) AS inscriptos_confirmados
    FROM public.cursos c
    WHERE c.id_curso_estado = 2
    ORDER BY c.nombre ASC
  `;

  const result = await pool.query(sql, [ESTADO_CONFIRMADA]);
  return result.rows;
}

async function obtenerParaDiploma(id_inscripcion) {
  return obtenerPorId(id_inscripcion);
}

module.exports = {
  ESTADO_CONFIRMADA,
  ESTADO_CANCELADA,
  listar,
  contar,
  obtenerPorId,
  obtenerEstudiantePorId,
  listarEstudiantesActivos,
  existeConfirmada,
  crear,
  cambiarEstado,
  cancelar,
  listarCursosAbiertos,
  obtenerParaDiploma,
};
