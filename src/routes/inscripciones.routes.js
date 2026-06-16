const express = require('express');
const inscripcionesController = require('../controllers/inscripciones.controller');
const {
  validarListadoInscripciones,
  validarIdInscripcion,
  validarCrearInscripcion,
} = require('../validators/inscripciones.validator');

const router = express.Router();

// Browse: listado con filtros y paginacion.
router.get('/', validarListadoInscripciones, inscripcionesController.listar);

// Datos auxiliares para el alta de inscripciones.
router.get('/opciones', inscripcionesController.opciones);

// Add: alta de una inscripcion.
router.post('/', validarCrearInscripcion, inscripcionesController.crear);

// Generacion / impresion de diploma individual.
router.get('/:id/diploma', validarIdInscripcion, inscripcionesController.diploma);

// Read: detalle de una inscripcion.
router.get('/:id', validarIdInscripcion, inscripcionesController.obtenerPorId);

// Delete: baja logica, cambia la inscripcion a CANCELADA.
router.delete('/:id', validarIdInscripcion, inscripcionesController.cancelar);

module.exports = router;
