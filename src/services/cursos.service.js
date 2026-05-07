// TODO: Reglas de negocio de cursos.
// TODO: ValidarCurso - revisar campos obligatorios, formatos y valores numericos.
// TODO: ValidarEstadoCurso - controlar si el curso puede editarse, activarse o darse de baja.
// TODO: ValidarInscripcion - verificar cupo, duplicados y estado habilitado.
// TODO: GenerarDiploma - preparar los datos del certificado PDF.

const cursoModel = require('../models/curso.model');
const pdfService = require('./pdf.service');

async function validarCurso(data) {
  const errores = [];

  if (!data) {
    errores.push('Los datos del curso son obligatorios.');
  } else {
    const nombre = typeof data.nombre === 'string' ? data.nombre.trim() : '';
    const fechaInicio = data.fecha_inicio ? new Date(data.fecha_inicio) : null;
    const hoy = new Date();
    const fechaMaxima = new Date();
    const cantidadHoras = Number(data.cantidad_horas);
    const inscriptosMax = Number(data.inscriptos_max);

    hoy.setHours(0, 0, 0, 0);
    fechaMaxima.setFullYear(fechaMaxima.getFullYear() + 5);
    fechaMaxima.setHours(23, 59, 59, 999);

    if (!nombre) {
      errores.push('El nombre del curso es obligatorio.');
    } else {
      if (nombre.length < 3) {
        errores.push('El nombre del curso debe tener al menos 3 caracteres.');
      }

      if (nombre.length > 100) {
        errores.push('El nombre del curso no puede superar los 100 caracteres.');
      }
    }

    if (!data.fecha_inicio || !fechaInicio || Number.isNaN(fechaInicio.getTime())) {
      errores.push('La fecha de inicio es obligatoria y debe ser valida.');
    } else {
      fechaInicio.setHours(0, 0, 0, 0);

      if (fechaInicio < hoy) {
        errores.push('La fecha de inicio no puede ser anterior a la fecha actual.');
      }

      if (fechaInicio > fechaMaxima) {
        errores.push('La fecha de inicio no puede superar los 5 años desde la fecha actual.');
      }
    }

    if (data.cantidad_horas === undefined || data.cantidad_horas === null || data.cantidad_horas === '') {
      errores.push('La cantidad de horas es obligatoria.');
    } else if (Number.isNaN(cantidadHoras) || cantidadHoras <= 0) {
      errores.push('La cantidad de horas debe ser un numero mayor a 0.');
    } else {
      if (!Number.isInteger(cantidadHoras)) {
        errores.push('La cantidad de horas debe ser un numero entero.');
      }

      if (cantidadHoras > 1000) {
        errores.push('La cantidad de horas no puede superar 1000.');
      }
    }

    if (data.inscriptos_max === undefined || data.inscriptos_max === null || data.inscriptos_max === '') {
      errores.push('La cantidad maxima de inscriptos es obligatoria.');
    } else if (Number.isNaN(inscriptosMax) || inscriptosMax <= 0) {
      errores.push('La cantidad maxima de inscriptos debe ser un numero mayor a 0.');
    } else {
      if (!Number.isInteger(inscriptosMax)) {
        errores.push('La cantidad maxima de inscriptos debe ser un numero entero.');
      }

      if (inscriptosMax > 1000) {
        errores.push('La cantidad maxima de inscriptos no puede superar 1000.');
      }
    }
  }

  if (errores.length > 0) {
    const error = new Error(errores.join(' '));
    error.status = 400;
    throw error;
  }

  return {
    ok: true,
    message: 'Curso válido.',
    data: {
      valido: true,
      curso: {
        ...data,
        nombre: data.nombre.trim(),
        cantidad_horas: Number(data.cantidad_horas),
        inscriptos_max: Number(data.inscriptos_max),
      },
    },
  };
}

async function validarEstadoCurso(data, { permitirEliminado = false } = {}) {
  if (data === undefined || data === null || data === '') {
    const error = new Error('El estado del curso es obligatorio.');
    error.status = 400;
    throw error;
  }

  const estadoNumerico = Number(data);
  const estadosPermitidos = permitirEliminado ? [1, 2, 3, 4] : [1, 2, 3];

  if (!Number.isInteger(estadoNumerico) || !estadosPermitidos.includes(estadoNumerico)) {
    const error = new Error(
      permitirEliminado
        ? 'El estado del curso debe ser un numero valido.'
        : 'El estado del curso debe ser 1, 2 o 3.'
    );
    error.status = 400;
    throw error;
  }

  return {
    ok: true,
    message: 'Estado del curso valido.',
    data: {
      valido: true,
      estado: estadoNumerico,
    },
  };
}
async function validarInscripcion(data) {
  if (!data) {
    const error = new Error('Los datos de la inscripción son obligatorios.');
    error.status = 400;
    throw error;
  }

  if (!data.id_curso) {
    const error = new Error('El curso es obligatorio.');
    error.status = 400;
    throw error;
  }

  const curso = await cursoModel.obtenerPorId(data.id_curso);

  if (!curso) {
    const error = new Error('El curso no existe.');
    error.status = 404;
    throw error;
  }

  if (curso.id_curso_estado === 4 || !curso.curso_estado_es_activo) {
    const error = new Error('El curso no está habilitado para inscripciones.');
    error.status = 400;
    throw error;
  }

  const cupo = await cursoModel.obtenerCupo(data.id_curso);

  if (!cupo) {
    const error = new Error('No se pudo obtener el cupo del curso.');
    error.status = 404;
    throw error;
  }

  if (Number(cupo.inscriptos_confirmados) >= Number(cupo.inscriptos_max)) {
    const error = new Error('No hay cupo disponible para este curso.');
    error.status = 400;
    throw error;
  }

  return {
    ok: true,
    message: 'Inscripción válida.',
    data: {
      valido: true,
      curso,
      cupo,
      inscripcion: data,
    },
  };
}

async function listarCursos(filtros = {}) {
  const cursos = await cursoModel.listar(filtros);

  return {
    ok: true,
    message: 'Listado de cursos obtenido correctamente.',
    data: cursos,
  };
}

async function obtenerCursoPorId(idCurso) {
  const curso = await cursoModel.obtenerPorId(idCurso);

  return {
    ok: Boolean(curso),
    message: curso ? 'Curso obtenido correctamente.' : 'Curso no encontrado.',
    data: curso,
  };
}

async function crearCurso(data) {
  const validacion = await validarCurso(data);
  const validacionEstado = await validarEstadoCurso(data.id_curso_estado ?? 1);
  const cursoValidado = validacion.data.curso;

  const curso = await cursoModel.crear({
    ...cursoValidado,
    id_curso_estado: validacionEstado.data.estado,
    id_usuario_modificacion: data.id_usuario_modificacion ?? 1,
  });

  return {
    ok: true,
    message: 'Curso creado correctamente.',
    data: curso,
  };
}

async function actualizarCurso(idCurso, data) {
  const validacionCurso = await validarCurso(data);
  const validacionEstado = await validarEstadoCurso(data.id_curso_estado);
  const cursoValidado = validacionCurso.data.curso;

  const cursoActualizado = {
    ...cursoValidado,
    id_usuario_modificacion: data.id_usuario_modificacion ?? 1,
  };

  if (
    validacionEstado.data.estado !== undefined
    && validacionEstado.data.estado !== null
    && validacionEstado.data.estado !== ''
  ) {
    cursoActualizado.id_curso_estado = validacionEstado.data.estado;
  }

  const curso = await cursoModel.actualizar(idCurso, cursoActualizado);

  return {
    ok: Boolean(curso),
    message: curso ? 'Curso actualizado correctamente.' : 'Curso no encontrado.',
    data: curso,
  };
}

async function eliminarCurso(idCurso) {
  await validarEstadoCurso(4, { permitirEliminado: true });

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

  const curso = await cursoModel.bajaLogica(idCurso, 1);

  return {
    ok: Boolean(curso),
    message: curso ? 'Curso dado de baja logica correctamente.' : 'Curso no encontrado.',
    data: curso,
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
      archivo: pdf.data.archivo,
    },
  };
}

module.exports = {
  validarCurso,
  validarEstadoCurso,
  validarInscripcion,
  listarCursos,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
  generarDiploma,
};

