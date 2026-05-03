const cursosService = require('../services/cursos.service');

async function listar(req, res, next) {
  try {
    const result = await cursosService.listarCursos(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const result = await cursosService.obtenerCursoPorId(req.params.id);
    return res.status(result.ok ? 200 : 404).json(result);
  } catch (error) {
    return next(error);
  }
}

async function crear(req, res, next) {
  try {
    const result = await cursosService.crearCurso(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const result = await cursosService.actualizarCurso(req.params.id, req.body);
    return res.status(result.ok ? 200 : 404).json(result);
  } catch (error) {
    return next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const result = await cursosService.eliminarCurso(req.params.id);
    return res.status(result.ok ? 200 : 404).json(result);
  } catch (error) {
    return next(error);
  }
}

async function diploma(req, res, next) {
  try {
    const result = await cursosService.generarDiploma(req.params.id);
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
  diploma,
};
