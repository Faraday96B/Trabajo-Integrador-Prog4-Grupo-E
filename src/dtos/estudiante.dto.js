function toNumberOrDefault(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return Number(value);
}

function toEstudianteInput(body = {}) {
  return {
    documento: body.documento,
    apellido: body.apellido,
    nombres: body.nombres,
    email: body.email,
    fecha_nacimiento: body.fechaNacimiento ?? body.fecha_nacimiento,
    activo: toNumberOrDefault(body.activo, 1),
    id_usuario_modificacion: toNumberOrDefault(
      body.idUsuarioModificacion ?? body.id_usuario_modificacion,
      undefined
    ),
  };
}

function toEstudianteResponse(estudiante) {
  if (!estudiante) {
    return null;
  }

  return {
    id: estudiante.id_estudiante,
    documento: estudiante.documento,
    apellido: estudiante.apellido,
    nombres: estudiante.nombres,
    email: estudiante.email,
    fechaNacimiento: estudiante.fecha_nacimiento,
    activo: Boolean(Number(estudiante.activo)),
    inscripcionesConfirmadas: Number(estudiante.inscripciones_confirmadas ?? 0),
    usuarioModificacion: {
      id: estudiante.id_usuario_modificacion,
      nombreUsuario: estudiante.usuario_nombre_usuario,
    },
    fechaHoraModificacion: estudiante.fecha_hora_modificacion,
  };
}

function toEstudianteListResponse(estudiantes = []) {
  return estudiantes.map(toEstudianteResponse);
}

module.exports = {
  toEstudianteInput,
  toEstudianteResponse,
  toEstudianteListResponse,
};
