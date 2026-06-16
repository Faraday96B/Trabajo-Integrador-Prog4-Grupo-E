const express = require('express');
const cursosController = require('../controllers/cursos.controller');
const {
  validarListadoCursos,
  validarIdCurso,
  validarCrearCurso,
  validarActualizarCurso,
} = require('../validators/cursos.validator');

const router = express.Router();

router.get('/', validarListadoCursos, cursosController.listar);
router.get('/:id', validarIdCurso, cursosController.obtenerPorId);
router.post('/', validarCrearCurso, cursosController.crear);
router.put('/:id', validarActualizarCurso, cursosController.actualizar);
router.delete('/:id', validarIdCurso, cursosController.eliminar);
router.get('/:id/diploma', validarIdCurso, cursosController.diploma);

module.exports = router;
