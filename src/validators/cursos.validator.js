const { body, param, query } = require('express-validator');
const { validarRequest } = require('../middleware/validation.middleware');

const ESTADOS_CURSO_PERMITIDOS = [1, 2, 3];

function getBodyValue(req, camelCaseName, snakeCaseName) {
  return req.body?.[camelCaseName] ?? req.body?.[snakeCaseName];
}

function isEmpty(value) {
  return value === undefined || value === null || value === '';
}

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validarFechaInicio(value) {
  const fechaInicio = parseDateOnly(value);

  if (!fechaInicio) {
    throw new Error('La fecha de inicio es obligatoria y debe ser valida.');
  }

  const hoy = new Date();
  const fechaMaxima = new Date();

  hoy.setHours(0, 0, 0, 0);
  fechaMaxima.setFullYear(fechaMaxima.getFullYear() + 5);
  fechaMaxima.setHours(23, 59, 59, 999);

  if (fechaInicio < hoy) {
    throw new Error('La fecha de inicio no puede ser anterior a la fecha actual.');
  }

  if (fechaInicio > fechaMaxima) {
    throw new Error('La fecha de inicio no puede superar los 5 años desde la fecha actual.');
  }

  return true;
}

function validarEnteroPositivo(value, fieldName) {
  const numberValue = Number(value);

  if (isEmpty(value)) {
    throw new Error(`${fieldName} es obligatoria.`);
  }

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${fieldName} debe ser un numero entero mayor a 0.`);
  }

  if (numberValue > 1000) {
    throw new Error(`${fieldName} no puede superar 1000.`);
  }

  return true;
}

const validarIdCurso = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id del curso debe ser un numero entero mayor a 0.')
    .toInt(),
  validarRequest,
];

const validarListadoCursos = [
  query('estado')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 4 })
    .withMessage('El estado del curso debe ser un numero valido.')
    .toInt(),
  query('fechaDesde')
    .optional({ checkFalsy: true })
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('La fecha desde debe ser valida.'),
  query('fechaHasta')
    .optional({ checkFalsy: true })
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('La fecha hasta debe ser valida.'),
  validarRequest,
];

const validarCursoBody = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre del curso es obligatorio.')
    .isLength({ min: 3 })
    .withMessage('El nombre del curso debe tener al menos 3 caracteres.')
    .isLength({ max: 100 })
    .withMessage('El nombre del curso no puede superar los 100 caracteres.'),
  body('fechaInicio')
    .custom((value, { req }) => validarFechaInicio(getBodyValue(req, 'fechaInicio', 'fecha_inicio'))),
  body('cantidadHoras')
    .custom((value, { req }) => validarEnteroPositivo(getBodyValue(req, 'cantidadHoras', 'cantidad_horas'), 'La cantidad de horas')),
  body('inscriptosMax')
    .custom((value, { req }) => validarEnteroPositivo(getBodyValue(req, 'inscriptosMax', 'inscriptos_max'), 'La cantidad maxima de inscriptos')),
  body('idCursoEstado')
    .custom((value, { req }) => {
      const estado = getBodyValue(req, 'idCursoEstado', 'id_curso_estado');

      if (isEmpty(estado)) {
        return true;
      }

      const estadoNumerico = Number(estado);

      if (!Number.isInteger(estadoNumerico) || !ESTADOS_CURSO_PERMITIDOS.includes(estadoNumerico)) {
        throw new Error('El estado del curso debe ser 1, 2 o 3.');
      }

      return true;
    }),
  validarRequest,
];

const validarCrearCurso = validarCursoBody;

const validarActualizarCurso = [
  ...validarIdCurso.slice(0, -1),
  ...validarCursoBody,
];

module.exports = {
  validarListadoCursos,
  validarIdCurso,
  validarCrearCurso,
  validarActualizarCurso,
};
