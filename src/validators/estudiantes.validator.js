const { body, param, query } = require('express-validator');
const { validarRequest } = require('../middleware/validation.middleware');

function getBodyValue(req, camelCaseName, snakeCaseName) {
  return req.body?.[camelCaseName] ?? req.body?.[snakeCaseName];
}

function getQueryValue(req, ...names) {
  for (const name of names) {
    const value = req.query?.[name];

    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
}

function isEmpty(value) {
  return value === undefined || value === null || value === '';
}

function validarEnteroPositivo(value, fieldName, { required = false, max = null } = {}) {
  if (isEmpty(value)) {
    if (required) {
      throw new Error(`${fieldName} es obligatorio.`);
    }

    return true;
  }

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${fieldName} debe ser un numero entero mayor a 0.`);
  }

  if (max !== null && numberValue > max) {
    throw new Error(`${fieldName} no puede superar ${max}.`);
  }

  return true;
}

function validarFechaNacimiento(value) {
  if (isEmpty(value) || typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('La fecha de nacimiento es obligatoria y debe ser valida.');
  }

  const fechaNacimiento = new Date(`${value}T00:00:00`);
  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);

  if (Number.isNaN(fechaNacimiento.getTime())) {
    throw new Error('La fecha de nacimiento es obligatoria y debe ser valida.');
  }

  if (fechaNacimiento > hoy) {
    throw new Error('La fecha de nacimiento no puede ser futura.');
  }

  return true;
}

function validarActivo(value) {
  if (isEmpty(value)) {
    return true;
  }

  const numberValue = Number(value);

  if (![0, 1].includes(numberValue)) {
    throw new Error('El estado activo debe ser 0 o 1.');
  }

  return true;
}

const validarIdEstudiante = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id del estudiante debe ser un numero entero mayor a 0.')
    .toInt(),
  validarRequest,
];

const validarListadoEstudiantes = [
  query('busqueda')
    .custom((value, { req }) => {
      const busqueda = getQueryValue(req, 'busqueda', 'q');

      if (!isEmpty(busqueda) && String(busqueda).trim().length > 100) {
        throw new Error('La busqueda no puede superar los 100 caracteres.');
      }

      return true;
    }),
  query('documento')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('El documento no puede superar los 20 caracteres.'),
  query('activo')
    .custom((value, { req }) => validarActivo(getQueryValue(req, 'activo'))),
  query('pagina')
    .custom((value, { req }) => validarEnteroPositivo(
      getQueryValue(req, 'pagina', 'page'),
      'La pagina'
    )),
  query('limite')
    .custom((value, { req }) => validarEnteroPositivo(
      getQueryValue(req, 'limite', 'limit'),
      'El limite',
      { max: 100 }
    )),
  validarRequest,
];

const validarEstudianteBody = [
  body('documento')
    .trim()
    .notEmpty()
    .withMessage('El documento es obligatorio.')
    .isLength({ min: 6, max: 20 })
    .withMessage('El documento debe tener entre 6 y 20 caracteres.')
    .matches(/^[0-9A-Za-z.-]+$/)
    .withMessage('El documento contiene caracteres no validos.'),
  body('apellido')
    .trim()
    .notEmpty()
    .withMessage('El apellido es obligatorio.')
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener entre 2 y 100 caracteres.'),
  body('nombres')
    .trim()
    .notEmpty()
    .withMessage('Los nombres son obligatorios.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Los nombres deben tener entre 2 y 100 caracteres.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio.')
    .isEmail()
    .withMessage('El email debe ser valido.')
    .isLength({ max: 255 })
    .withMessage('El email no puede superar los 255 caracteres.'),
  body('fechaNacimiento')
    .custom((value, { req }) => validarFechaNacimiento(
      getBodyValue(req, 'fechaNacimiento', 'fecha_nacimiento')
    )),
  body('activo')
    .custom((value, { req }) => validarActivo(getBodyValue(req, 'activo', 'activo'))),
  validarRequest,
];

const validarCrearEstudiante = validarEstudianteBody;

const validarActualizarEstudiante = [
  ...validarIdEstudiante.slice(0, -1),
  ...validarEstudianteBody,
];

module.exports = {
  validarListadoEstudiantes,
  validarIdEstudiante,
  validarCrearEstudiante,
  validarActualizarEstudiante,
};
