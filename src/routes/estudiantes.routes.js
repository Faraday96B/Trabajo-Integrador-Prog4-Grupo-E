const express = require('express');
const estudiantesController = require('../controllers/estudiantes.controller');
const {
  validarListadoEstudiantes,
  validarIdEstudiante,
  validarCrearEstudiante,
  validarActualizarEstudiante,
} = require('../validators/estudiantes.validator');

const router = express.Router();

router.get('/', validarListadoEstudiantes, estudiantesController.listar);
router.get('/:id', validarIdEstudiante, estudiantesController.obtenerPorId);
router.post('/', validarCrearEstudiante, estudiantesController.crear);
router.put('/:id', validarActualizarEstudiante, estudiantesController.actualizar);
router.delete('/:id', validarIdEstudiante, estudiantesController.eliminar);

module.exports = router;
