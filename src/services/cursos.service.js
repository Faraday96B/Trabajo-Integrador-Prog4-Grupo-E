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

async function listarCursos(filtros = {}) {
  const cursos = await cursoModel.listar(filtros);

  return {
    ok: true,
    message: 'Listado de cursos obtenido correctamente.',
    data: toCursoListResponse(cursos),
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
