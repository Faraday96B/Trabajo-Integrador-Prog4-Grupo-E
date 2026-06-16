const estudiantesService = require('../services/estudiantes.service');

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
    const result = await estudiantesService.listarEstudiantes(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const result = await estudiantesService.obtenerEstudiantePorId(req.params.id);
    return res.status(result.ok ? 200 : 404).json(result);
  } catch (error) {
    return next(error);
  }
}

async function crear(req, res, next) {
  try {
    const idUsuario = obtenerIdUsuarioAutenticado(req);
    const result = await estudiantesService.crearEstudiante(req.body, idUsuario);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const idUsuario = obtenerIdUsuarioAutenticado(req);
    const result = await estudiantesService.actualizarEstudiante(req.params.id, req.body, idUsuario);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const idUsuario = obtenerIdUsuarioAutenticado(req);
    const result = await estudiantesService.eliminarEstudiante(req.params.id, idUsuario);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
};
