function toNumberOrDefault(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return Number(value);
}

function toCursoInput(body = {}) {
  return {
    nombre: body.nombre,
    descripcion: body.descripcion ?? '',
    fecha_inicio: body.fechaInicio ?? body.fecha_inicio,
    cantidad_horas: toNumberOrDefault(body.cantidadHoras ?? body.cantidad_horas, undefined),
    inscriptos_max: toNumberOrDefault(body.inscriptosMax ?? body.inscriptos_max, undefined),
    id_curso_estado: toNumberOrDefault(body.idCursoEstado ?? body.id_curso_estado, 1),
    id_usuario_modificacion: toNumberOrDefault(body.idUsuarioModificacion ?? body.id_usuario_modificacion, 1),
  };
}

function toCursoResponse(curso) {
  if (!curso) {
    return null;
  }

  return {
    id: curso.id_curso,
    nombre: curso.nombre,
    descripcion: curso.descripcion,
    fechaInicio: curso.fecha_inicio,
    cantidadHoras: curso.cantidad_horas,
    inscriptosMax: curso.inscriptos_max,
    inscriptosConfirmados: Number(curso.inscriptos_confirmados ?? 0),
    estado: {
      id: curso.id_curso_estado,
      descripcion: curso.curso_estado_descripcion,
      activo: Boolean(Number(curso.curso_estado_es_activo)),
    },
    usuarioModificacion: {
      id: curso.id_usuario_modificacion,
      nombreUsuario: curso.usuario_nombre_usuario,
    },
    fechaHoraModificacion: curso.fecha_hora_modificacion,
  };
}

function toCursoListResponse(cursos = []) {
  return cursos.map(toCursoResponse);
}

module.exports = {
  toCursoInput,
  toCursoResponse,
  toCursoListResponse,
};
