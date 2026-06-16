const inscripcionesService = require('../services/inscripciones.service');

function obtenerIdUsuarioAutenticado(req) {
  const idUsuario = req.user?.idUsuario;

  if (!idUsuario) {
    const error = new Error('No se pudo identificar el usuario autenticado.');
    error.status = 401;
    throw error;
  }

  return idUsuario;
}

async function listar(req, res, next) {
  try {
    const result = await inscripcionesService.listarInscripciones(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function opciones(req, res, next) {
  try {
    const result = await inscripcionesService.obtenerOpcionesInscripcion();
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const result = await inscripcionesService.obtenerInscripcionPorId(req.params.id);
    return res.status(result.ok ? 200 : 404).json(result);
  } catch (error) {
    return next(error);
  }
}

async function crear(req, res, next) {
  try {
    const idUsuario = obtenerIdUsuarioAutenticado(req);
    const result = await inscripcionesService.crearInscripcion(req.body, idUsuario);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function cancelar(req, res, next) {
  try {
    const idUsuario = obtenerIdUsuarioAutenticado(req);
    const result = await inscripcionesService.cancelarInscripcion(req.params.id, idUsuario);
    return res.status(result.ok ? 200 : 404).json(result);
  } catch (error) {
    return next(error);
  }
}

async function diploma(req, res, next) {
  try {
    const result = await inscripcionesService.generarDiplomaIndividual(req.params.id);
    const pdfBuffer = result.data.buffer;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${result.data.nombreArchivo}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listar,
  opciones,
  obtenerPorId,
  crear,
  cancelar,
  diploma,
};
