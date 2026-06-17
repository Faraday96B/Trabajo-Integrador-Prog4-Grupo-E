const cursoModel = require('../models/curso.model');
const pdfService = require('./pdf.service');
const { toCursoInput, toCursoListResponse, toCursoResponse } = require('../dtos/curso.dto');

function normalizarCursoInput(cursoInput) {
  return {
    ...cursoInput,
    nombre: cursoInput.nombre.trim(),
    cantidad_horas: Number(cursoInput.cantidad_horas),
    inscriptos_max: Number(cursoInput.inscriptos_max),
    id_curso_estado: Number(cursoInput.id_curso_estado),
  };
}

function crearError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function buildPagination(query = {}) {
  const pagina = Math.max(1, Number(query.pagina ?? query.page ?? 1) || 1);
  const limiteInput = Number(query.limite ?? query.limit ?? 10) || 10;
  const limite = Math.min(Math.max(1, limiteInput), 100);

  return {
    pagina,
    limite,
    offset: (pagina - 1) * limite,
  };
}

function buildFiltros(query = {}) {
  const pagination = buildPagination(query);

  return {
    nombre: query.nombre,
    estado: query.estado,
    fechaDesde: query.fechaDesde ?? query.fecha_desde,
    fechaHasta: query.fechaHasta ?? query.fecha_hasta,
    inscripcion: query.inscripcion,
    limit: pagination.limite,
    offset: pagination.offset,
    pagination,
  };
}

async function validarNombreUnico(nombre, excluirId = null) {
  const existeNombre = await cursoModel.existeNombre(nombre, excluirId);

  if (existeNombre) {
    throw crearError('Ya existe un curso activo con ese nombre.');
  }
}

async function listarCursos(filtros = {}) {
  const filtrosConstruidos = buildFiltros(filtros);
  const { pagination, ...modelFilters } = filtrosConstruidos;
  const [cursos, total] = await Promise.all([
    cursoModel.listar(modelFilters),
    cursoModel.contar(modelFilters),
  ]);

  return {
    ok: true,
    message: 'Listado de cursos obtenido correctamente.',
    data: toCursoListResponse(cursos),
    meta: {
      total,
      pagina: pagination.pagina,
      limite: pagination.limite,
      totalPaginas: Math.ceil(total / pagination.limite),
    },
  };
}

async function obtenerCursoPorId(idCurso) {
  const curso = await cursoModel.obtenerPorId(idCurso);

  return {
    ok: Boolean(curso),
    message: curso ? 'Curso obtenido correctamente.' : 'Curso no encontrado.',
    data: toCursoResponse(curso),
  };
}

async function crearCurso(data) {
  const cursoValidado = normalizarCursoInput(toCursoInput(data));

  await validarNombreUnico(cursoValidado.nombre);

  const cursoCreado = await cursoModel.crear({
    ...cursoValidado,
    id_usuario_modificacion: cursoValidado.id_usuario_modificacion,
  });
  const curso = cursoCreado ? await cursoModel.obtenerPorId(cursoCreado.id_curso) : null;

  return {
    ok: true,
    message: 'Curso creado correctamente.',
    data: toCursoResponse(curso),
  };
}

async function actualizarCurso(idCurso, data) {
  const cursoValidado = normalizarCursoInput(toCursoInput(data));

  await validarNombreUnico(cursoValidado.nombre, idCurso);

  const cursoActualizado = {
    ...cursoValidado,
    id_usuario_modificacion: cursoValidado.id_usuario_modificacion,
  };

  const cursoEditado = await cursoModel.actualizar(idCurso, cursoActualizado);
  const curso = cursoEditado ? await cursoModel.obtenerPorId(idCurso) : null;

  return {
    ok: Boolean(curso),
    message: curso ? 'Curso actualizado correctamente.' : 'Curso no encontrado.',
    data: toCursoResponse(curso),
  };
}

async function eliminarCurso(idCurso, idUsuarioModificacion = 1) {
  const cursoExistente = await cursoModel.obtenerPorId(idCurso);

  if (!cursoExistente) {
    const error = new Error('Curso no encontrado.');
    error.status = 404;
    throw error;
  }

  if (cursoExistente.id_curso_estado === 4) {
    const error = new Error('El curso ya está dado de baja.');
    error.status = 400;
    throw error;
  }

  const cursoEliminado = await cursoModel.bajaLogica(idCurso, idUsuarioModificacion);
  const curso = cursoEliminado ? await cursoModel.obtenerPorId(idCurso) : null;

  return {
    ok: Boolean(curso),
    message: curso ? 'Curso dado de baja logica correctamente.' : 'Curso no encontrado.',
    data: toCursoResponse(curso),
  };
}

async function generarDiploma(idCurso) {
  const curso = await cursoModel.obtenerParaDiploma(idCurso);

  if (!curso) {
    const error = new Error('Curso no encontrado para generar diploma.');
    error.status = 404;
    throw error;
  }

  const certificado = {
    titulo: 'Certificado de finalización',
    nombreCurso: curso.nombre,
    descripcionCurso: curso.descripcion,
    fechaInicio: curso.fecha_inicio,
    cantidadHoras: curso.cantidad_horas,
    estadoCurso: curso.curso_estado_descripcion,
  };

  const pdf = await pdfService.generarCertificadoPDF(certificado);

  return {
    ok: true,
    message: 'Diploma generado correctamente.',
    data: {
      curso,
      certificado,
      buffer: pdf.data.buffer,
      nombreArchivo: pdf.data.nombreArchivo,
    },
  };
}

module.exports = {
  listarCursos,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
  generarDiploma,
};
