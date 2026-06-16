const express = require('express');
const inscripcionesController = require('../controllers/inscripciones.controller');

const router = express.Router();

// Browse: listado con filtros y paginacion.
router.get('/', inscripcionesController.listar);

// Datos auxiliares para el alta de inscripciones.
router.get('/opciones', inscripcionesController.opciones);

// Add: alta de una inscripcion.
router.post('/', inscripcionesController.crear);

// Generacion / impresion de diploma individual.
router.get('/:id/diploma', inscripcionesController.diploma);

// Read: detalle de una inscripcion.
router.get('/:id', inscripcionesController.obtenerPorId);

// Delete: baja logica, cambia la inscripcion a CANCELADA.
router.delete('/:id', inscripcionesController.cancelar);

module.exports = router;
