// Boceto de consultas necesarias para la capa de inscripciones.
//
// listar(filtros):
// - Debe devolver inscripciones con datos de curso, estudiante y estado.
// - Debe soportar paginacion.
// - Filtros sugeridos: curso, estudiante, documento, estado y fecha.
//
// obtenerPorId(id_inscripcion):
// - Debe devolver una inscripcion completa.
//
// existeConfirmada(id_curso, id_estudiante):
// - Debe detectar duplicados activos antes de crear una inscripcion.
//
// crear({ id_curso, id_estudiante, id_usuario_modificacion }):
// - Debe insertar con estado CONFIRMADA y fecha_hora_inscripcion actual.
//
// cancelar(id_inscripcion, id_usuario_modificacion):
// - Debe hacer soft delete cambiando estado a CANCELADA.
//
// obtenerParaDiploma(id_inscripcion):
// - Debe devolver datos del estudiante, curso e inscripcion para el PDF.

module.exports = {};
