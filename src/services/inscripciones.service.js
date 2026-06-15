function pendiente(nombreOperacion, extra = {}) {
  return {
    ok: false,
    message: `Endpoint de inscripciones definido. Falta implementar: ${nombreOperacion}.`,
    data: {
      pendiente: true,
      ...extra,
    },
  };
}

async function listarInscripciones(filtros = {}) {
  return pendiente('listar inscripciones con filtros y paginacion', {
    filtrosEsperados: ['pagina', 'limite', 'idCurso', 'idEstudiante', 'estado', 'documento'],
    filtrosRecibidos: filtros,
  });
}

async function obtenerInscripcionPorId(idInscripcion) {
  return pendiente('obtener detalle de una inscripcion', {
    idInscripcion,
  });
}

async function crearInscripcion(data, idUsuarioModificacion) {
  return pendiente('crear inscripcion validando cupo, estado del curso y duplicados', {
    camposEsperados: ['idCurso', 'idEstudiante'],
    bodyRecibido: data,
    idUsuarioModificacion,
  });
}

async function cancelarInscripcion(idInscripcion, idUsuarioModificacion) {
  return pendiente('cancelar inscripcion con baja logica', {
    idInscripcion,
    idUsuarioModificacion,
    estadoDestino: 'CANCELADA',
  });
}

async function generarDiplomaIndividual(idInscripcion) {
  return pendiente('generar diploma individual en PDF', {
    idInscripcion,
    dependenciasFuturas: ['handlebars', 'puppeteer'],
  });
}

module.exports = {
  listarInscripciones,
  obtenerInscripcionPorId,
  crearInscripcion,
  cancelarInscripcion,
  generarDiplomaIndividual,
};
