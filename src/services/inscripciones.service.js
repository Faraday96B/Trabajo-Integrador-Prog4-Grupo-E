const cursoModel = require('../models/curso.model');
const inscripcionModel = require('../models/inscripcion.model');
const pdfService = require('./pdf.service');
const {
  toInscripcionInput,
  toInscripcionListResponse,
  toInscripcionResponse,
} = require('../dtos/inscripcion.dto');

const CURSO_ESTADO_INSCRIPCION_ABIERTA = 2;
const CURSO_ESTADO_INSCRIPCION_CERRADA = 3;

function crearError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizarInscripcionInput(inscripcionInput) {
  return {
    id_curso: Number(inscripcionInput.id_curso),
    id_estudiante: Number(inscripcionInput.id_estudiante),
  };
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
    idCurso: query.idCurso ?? query.id_curso,
    idEstudiante: query.idEstudiante ?? query.id_estudiante,
    estado: query.estado ?? query.idInscripcionEstado ?? query.id_inscripcion_estado,
    documento: query.documento,
    busqueda: query.busqueda ?? query.q,
    fechaDesde: query.fechaDesde ?? query.fecha_desde,
    fechaHasta: query.fechaHasta ?? query.fecha_hasta,
    limit: pagination.limite,
    offset: pagination.offset,
    pagination,
  };
}

async function validarCursoParaInscripcion(idCurso) {
  const curso = await cursoModel.obtenerPorId(idCurso);

  if (!curso) {
    throw crearError('El curso no existe.', 404);
  }

  if (Number(curso.id_curso_estado) !== CURSO_ESTADO_INSCRIPCION_ABIERTA) {
    throw crearError('El curso no tiene la inscripcion abierta.');
  }

  const cupo = await cursoModel.obtenerCupo(idCurso);

  if (!cupo) {
    throw crearError('No se pudo obtener el cupo del curso.', 404);
  }

  if (Number(cupo.inscriptos_confirmados) >= Number(cupo.inscriptos_max)) {
    throw crearError('No hay cupo disponible para este curso.');
  }

  return { curso, cupo };
}

async function validarEstudianteActivo(idEstudiante) {
  const estudiante = await inscripcionModel.obtenerEstudiantePorId(idEstudiante);

  if (!estudiante) {
    throw crearError('El estudiante no existe.', 404);
  }

  if (!Number(estudiante.activo)) {
    throw crearError('El estudiante no esta activo.');
  }

  return estudiante;
}

async function listarInscripciones(query = {}) {
  const filtros = buildFiltros(query);
  const { pagination, ...modelFilters } = filtros;
  const [inscripciones, total] = await Promise.all([
    inscripcionModel.listar(modelFilters),
    inscripcionModel.contar(modelFilters),
  ]);

  return {
    ok: true,
    message: 'Listado de inscripciones obtenido correctamente.',
    data: toInscripcionListResponse(inscripciones),
    meta: {
      total,
      pagina: pagination.pagina,
      limite: pagination.limite,
      totalPaginas: Math.ceil(total / pagination.limite),
    },
  };
}

async function obtenerInscripcionPorId(idInscripcion) {
  const id = Number(idInscripcion);
  const inscripcion = await inscripcionModel.obtenerPorId(id);

  return {
    ok: Boolean(inscripcion),
    message: inscripcion ? 'Inscripcion obtenida correctamente.' : 'Inscripcion no encontrada.',
    data: toInscripcionResponse(inscripcion),
  };
}

async function crearInscripcion(data, idUsuarioModificacion) {
  const inscripcionInput = normalizarInscripcionInput(toInscripcionInput(data));
  const idCurso = inscripcionInput.id_curso;
  const idEstudiante = inscripcionInput.id_estudiante;
  const idUsuario = Number(idUsuarioModificacion);

  await validarCursoParaInscripcion(idCurso);
  await validarEstudianteActivo(idEstudiante);

  const duplicada = await inscripcionModel.existeConfirmada(idCurso, idEstudiante);

  if (duplicada) {
    throw crearError('El estudiante ya tiene una inscripcion confirmada para este curso.');
  }

  const inscripcionCreada = await inscripcionModel.crear({
    id_curso: idCurso,
    id_estudiante: idEstudiante,
    id_usuario_modificacion: idUsuario,
  });
  const inscripcion = inscripcionCreada
    ? await inscripcionModel.obtenerPorId(inscripcionCreada.id_inscripcion)
    : null;

  return {
    ok: true,
    message: 'Inscripcion creada correctamente.',
    data: toInscripcionResponse(inscripcion),
  };
}

async function cancelarInscripcion(idInscripcion, idUsuarioModificacion) {
  const id = Number(idInscripcion);
  const idUsuario = Number(idUsuarioModificacion);
  const inscripcionExistente = await inscripcionModel.obtenerPorId(id);

  if (!inscripcionExistente) {
    throw crearError('Inscripcion no encontrada.', 404);
  }

  if (Number(inscripcionExistente.id_inscripcion_estado) === inscripcionModel.ESTADO_CANCELADA) {
    throw crearError('La inscripcion ya esta cancelada.');
  }

  await inscripcionModel.cancelar(id, idUsuario);
  const inscripcion = await inscripcionModel.obtenerPorId(id);

  return {
    ok: true,
    message: 'Inscripcion cancelada correctamente.',
    data: toInscripcionResponse(inscripcion),
  };
}

async function obtenerOpcionesInscripcion() {
  const [cursos, estudiantes] = await Promise.all([
    inscripcionModel.listarCursosAbiertos(),
    inscripcionModel.listarEstudiantesActivos(),
  ]);

  return {
    ok: true,
    message: 'Opciones de inscripcion obtenidas correctamente.',
    data: {
      cursos: cursos.map((curso) => ({
        id: curso.id_curso,
        nombre: curso.nombre,
        fechaInicio: curso.fecha_inicio,
        cantidadHoras: curso.cantidad_horas,
        inscriptosMax: curso.inscriptos_max,
        inscriptosConfirmados: Number(curso.inscriptos_confirmados ?? 0),
      })),
      estudiantes: estudiantes.map((estudiante) => ({
        id: estudiante.id_estudiante,
        documento: estudiante.documento,
        apellido: estudiante.apellido,
        nombres: estudiante.nombres,
        email: estudiante.email,
      })),
    },
  };
}

async function generarDiplomaIndividual(idInscripcion) {
  const id = Number(idInscripcion);
  const inscripcion = await inscripcionModel.obtenerParaDiploma(id);

  if (!inscripcion) {
    throw crearError('Inscripcion no encontrada para generar diploma.', 404);
  }

  if (Number(inscripcion.id_inscripcion_estado) === inscripcionModel.ESTADO_CANCELADA) {
    throw crearError('No se puede generar diploma de una inscripcion cancelada.');
  }

  if (Number(inscripcion.id_curso_estado) !== CURSO_ESTADO_INSCRIPCION_CERRADA) {
    throw crearError('El diploma solo puede generarse cuando la inscripcion del curso esta cerrada.');
  }

  const inscripcionResponse = toInscripcionResponse(inscripcion);

  if (!inscripcionResponse?.curso?.id) {
    throw crearError('El curso asociado a la inscripcion no existe.', 404);
  }

  if (!inscripcionResponse?.estudiante?.id) {
    throw crearError('El estudiante asociado a la inscripcion no existe.', 404);
  }

  const estudianteNombre = `${inscripcionResponse.estudiante.apellido}, ${inscripcionResponse.estudiante.nombres}`.trim();
  const pdf = await pdfService.generarDiplomaInscripcionPDF({
    idInscripcion: inscripcionResponse.id,
    estudianteNombre,
    documento: inscripcionResponse.estudiante.documento,
    nombreCurso: inscripcionResponse.curso.nombre,
    cantidadHoras: inscripcionResponse.curso.cantidadHoras,
    fechaInicio: inscripcionResponse.curso.fechaInicio,
    fechaInscripcion: inscripcionResponse.fechaHoraInscripcion,
    estadoInscripcion: inscripcionResponse.estado.descripcion,
  });

  return {
    ok: true,
    message: 'Diploma generado correctamente.',
    data: {
      inscripcion: inscripcionResponse,
      buffer: pdf.data.buffer,
      nombreArchivo: pdf.data.nombreArchivo,
    },
  };
}

module.exports = {
  listarInscripciones,
  obtenerInscripcionPorId,
  crearInscripcion,
  cancelarInscripcion,
  obtenerOpcionesInscripcion,
  generarDiplomaIndividual,
};
