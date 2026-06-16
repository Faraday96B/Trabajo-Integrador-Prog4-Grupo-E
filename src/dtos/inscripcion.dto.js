function toNumberOrDefault(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return Number(value);
}

function toInscripcionInput(body = {}) {
  return {
    id_curso: toNumberOrDefault(body.idCurso ?? body.id_curso, undefined),
    id_estudiante: toNumberOrDefault(body.idEstudiante ?? body.id_estudiante, undefined),
  };
}

function toInscripcionResponse(inscripcion) {
  if (!inscripcion) {
    return null;
  }

  return {
    id: inscripcion.id_inscripcion,
    fechaHoraInscripcion: inscripcion.fecha_hora_inscripcion,
    estado: {
      id: inscripcion.id_inscripcion_estado,
      descripcion: inscripcion.inscripcion_estado_descripcion,
      activo: Boolean(Number(inscripcion.inscripcion_estado_es_activo)),
    },
    curso: {
      id: inscripcion.id_curso,
      nombre: inscripcion.curso_nombre,
      fechaInicio: inscripcion.curso_fecha_inicio,
      cantidadHoras: inscripcion.curso_cantidad_horas,
      inscriptosMax: inscripcion.curso_inscriptos_max,
      estado: {
        id: inscripcion.id_curso_estado,
        descripcion: inscripcion.curso_estado_descripcion,
      },
    },
    estudiante: {
      id: inscripcion.id_estudiante,
      documento: inscripcion.estudiante_documento,
      apellido: inscripcion.estudiante_apellido,
      nombres: inscripcion.estudiante_nombres,
      email: inscripcion.estudiante_email,
      activo: Boolean(Number(inscripcion.estudiante_activo)),
    },
    usuarioModificacion: {
      id: inscripcion.id_usuario_modificacion,
      nombreUsuario: inscripcion.usuario_nombre_usuario,
    },
    fechaHoraModificacion: inscripcion.fecha_hora_modificacion,
  };
}

function toInscripcionListResponse(inscripciones = []) {
  return inscripciones.map(toInscripcionResponse);
}

module.exports = {
  toInscripcionInput,
  toInscripcionResponse,
  toInscripcionListResponse,
};
