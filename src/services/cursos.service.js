// TODO: Reglas de negocio de cursos.
// TODO: ValidarCurso - revisar campos obligatorios, formatos y valores numericos.
// TODO: ValidarEstadoCurso - controlar si el curso puede editarse, activarse o darse de baja.
// TODO: ValidarInscripcion - verificar cupo, duplicados y estado habilitado.
// TODO: GenerarDiploma - preparar los datos del certificado PDF.

const cursoModel = require('../models/curso.model');

async function validarCurso(data) {
  return {
    ok: true,
    message: 'Validacion de curso pendiente de implementacion real.',
    data: {
      valido: true,
      curso: data,
    },
  };
}

async function validarEstadoCurso(data) {
  return {
    ok: true,
    message: 'Validacion de estado del curso pendiente de implementacion real.',
    data: {
      valido: true,
      estado: data,
    },
  };
}

async function validarInscripcion(data) {
  return {
    ok: true,
    message: 'Validacion de inscripcion pendiente de implementacion real.',
    data: {
      valido: true,
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
  await validarCurso(data);

  const curso = await cursoModel.crear({
    ...data,
    id_curso_estado: data.id_curso_estado ?? 1,
    id_usuario_modificacion: data.id_usuario_modificacion ?? 1,
  });

  return {
    ok: true,
    message: 'Curso creado correctamente.',
    data: curso,
  };
}

async function actualizarCurso(idCurso, data) {
  await validarCurso(data);
  await validarEstadoCurso(data.id_curso_estado);

  const curso = await cursoModel.actualizar(idCurso, {
    ...data,
    id_usuario_modificacion: data.id_usuario_modificacion ?? 1,
  });

  return {
    ok: Boolean(curso),
    message: curso ? 'Curso actualizado correctamente.' : 'Curso no encontrado.',
    data: curso,
  };
}

async function eliminarCurso(idCurso) {
  await validarEstadoCurso(4);

  const curso = await cursoModel.bajaLogica(idCurso, 1);

  return {
    ok: Boolean(curso),
    message: curso ? 'Curso dado de baja logica correctamente.' : 'Curso no encontrado.',
    data: curso,
  };
}

async function generarDiploma(idCurso) {
  await validarInscripcion({ id_curso: idCurso });

  const curso = await cursoModel.obtenerParaDiploma(idCurso);

  return {
    ok: true,
    message: 'Diploma pendiente de generacion real en PDF.',
    data: {
      curso,
      archivo: null,
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
