const inscripcionesService = require('../services/inscripciones.service');

async function listar(req, res, next) {
  try {
    const result = await inscripcionesService.listarInscripciones(req.query);
    return res.status(501).json(result);
  } catch (error) {
    return next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const result = await inscripcionesService.obtenerInscripcionPorId(req.params.id);
    return res.status(501).json(result);
  } catch (error) {
    return next(error);
  }
}

async function crear(req, res, next) {
  try {
    const idUsuario = req.user?.idUsuario ?? 1;
    const result = await inscripcionesService.crearInscripcion(req.body, idUsuario);
    return res.status(501).json(result);
  } catch (error) {
    return next(error);
  }
}

async function cancelar(req, res, next) {
  try {
    const idUsuario = req.user?.idUsuario ?? 1;
    const result = await inscripcionesService.cancelarInscripcion(req.params.id, idUsuario);
    return res.status(501).json(result);
  } catch (error) {
    return next(error);
  }
}

async function diploma(req, res, next) {
  try {
    const result = await inscripcionesService.generarDiplomaIndividual(req.params.id);
    return res.status(501).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  cancelar,
  diploma,
};
