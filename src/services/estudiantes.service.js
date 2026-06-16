const estudianteModel = require('../models/estudiante.model');
const {
  toEstudianteInput,
  toEstudianteListResponse,
  toEstudianteResponse,
} = require('../dtos/estudiante.dto');

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
    busqueda: query.busqueda ?? query.q,
    documento: query.documento,
    activo: query.activo,
    limit: pagination.limite,
    offset: pagination.offset,
    pagination,
  };
}

function normalizarEstudianteInput(estudianteInput) {
  return {
    ...estudianteInput,
    documento: estudianteInput.documento.trim(),
    apellido: estudianteInput.apellido.trim().toUpperCase(),
    nombres: estudianteInput.nombres.trim().toUpperCase(),
    email: estudianteInput.email.trim().toLowerCase(),
    activo: Number(estudianteInput.activo ?? 1),
    id_usuario_modificacion: Number(estudianteInput.id_usuario_modificacion),
  };
}

async function validarUnicos({ documento, email }, excluirId = null) {
  const [documentoExistente, emailExistente] = await Promise.all([
    estudianteModel.existeDocumento(documento, excluirId),
    estudianteModel.existeEmail(email, excluirId),
  ]);

  if (documentoExistente) {
    throw crearError('Ya existe un estudiante con ese documento.');
  }

  if (emailExistente) {
    throw crearError('Ya existe un estudiante con ese email.');
  }
}

async function listarEstudiantes(query = {}) {
  const filtros = buildFiltros(query);
  const { pagination, ...modelFilters } = filtros;
  const [estudiantes, total] = await Promise.all([
    estudianteModel.listar(modelFilters),
    estudianteModel.contar(modelFilters),
  ]);

  return {
    ok: true,
    message: 'Listado de estudiantes obtenido correctamente.',
    data: toEstudianteListResponse(estudiantes),
    meta: {
      total,
      pagina: pagination.pagina,
      limite: pagination.limite,
      totalPaginas: Math.ceil(total / pagination.limite),
    },
  };
}

async function obtenerEstudiantePorId(idEstudiante) {
  const estudiante = await estudianteModel.obtenerPorId(Number(idEstudiante));

  return {
    ok: Boolean(estudiante),
    message: estudiante ? 'Estudiante obtenido correctamente.' : 'Estudiante no encontrado.',
    data: toEstudianteResponse(estudiante),
  };
}

async function crearEstudiante(data, idUsuarioModificacion) {
  const estudianteValidado = normalizarEstudianteInput({
    ...toEstudianteInput(data),
    id_usuario_modificacion: idUsuarioModificacion,
  });

  await validarUnicos(estudianteValidado);

  const estudianteCreado = await estudianteModel.crear(estudianteValidado);
  const estudiante = estudianteCreado
    ? await estudianteModel.obtenerPorId(estudianteCreado.id_estudiante)
    : null;

  return {
    ok: true,
    message: 'Estudiante creado correctamente.',
    data: toEstudianteResponse(estudiante),
  };
}

async function actualizarEstudiante(idEstudiante, data, idUsuarioModificacion) {
  const id = Number(idEstudiante);
  const estudianteExistente = await estudianteModel.obtenerPorId(id);

  if (!estudianteExistente) {
    throw crearError('Estudiante no encontrado.', 404);
  }

  const estudianteValidado = normalizarEstudianteInput({
    ...toEstudianteInput(data),
    id_usuario_modificacion: idUsuarioModificacion,
  });

  await validarUnicos(estudianteValidado, id);

  await estudianteModel.actualizar(id, estudianteValidado);
  const estudiante = await estudianteModel.obtenerPorId(id);

  return {
    ok: true,
    message: 'Estudiante actualizado correctamente.',
    data: toEstudianteResponse(estudiante),
  };
}

async function eliminarEstudiante(idEstudiante, idUsuarioModificacion) {
  const id = Number(idEstudiante);
  const estudianteExistente = await estudianteModel.obtenerPorId(id);

  if (!estudianteExistente) {
    throw crearError('Estudiante no encontrado.', 404);
  }

  if (!Number(estudianteExistente.activo)) {
    throw crearError('El estudiante ya esta dado de baja.');
  }

  await estudianteModel.bajaLogica(id, Number(idUsuarioModificacion));
  const estudiante = await estudianteModel.obtenerPorId(id);

  return {
    ok: true,
    message: 'Estudiante dado de baja correctamente.',
    data: toEstudianteResponse(estudiante),
  };
}

module.exports = {
  listarEstudiantes,
  obtenerEstudiantePorId,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
};
