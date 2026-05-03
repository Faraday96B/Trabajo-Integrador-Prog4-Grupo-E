const express = require('express');
const cursosController = require('../controllers/cursos.controller');

const router = express.Router();

router.get('/', cursosController.listar);
router.get('/:id', cursosController.obtenerPorId);
router.post('/', cursosController.crear);
router.put('/:id', cursosController.actualizar);
router.delete('/:id', cursosController.eliminar);
router.get('/:id/diploma', cursosController.diploma);

module.exports = router;
