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

function validarFecha(value, fieldName) {
  if (isEmpty(value)) {
    return true;
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} debe ser una fecha valida.`);
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} debe ser una fecha valida.`);
  }

  return true;
}

const validarIdInscripcion = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id de inscripcion debe ser un numero entero mayor a 0.')
    .toInt(),
  validarRequest,
];

const validarListadoInscripciones = [
  query('idCurso')
    .custom((value, { req }) => validarEnteroPositivo(
      getQueryValue(req, 'idCurso', 'id_curso'),
      'El curso'
    )),
  query('idEstudiante')
    .custom((value, { req }) => validarEnteroPositivo(
      getQueryValue(req, 'idEstudiante', 'id_estudiante'),
      'El estudiante'
    )),
  query('estado')
    .custom((value, { req }) => validarEnteroPositivo(
      getQueryValue(req, 'estado', 'idInscripcionEstado', 'id_inscripcion_estado'),
      'El estado de inscripcion'
    )),
  query('documento')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('El documento no puede superar los 20 caracteres.'),
  query('busqueda')
    .custom((value, { req }) => {
      const busqueda = getQueryValue(req, 'busqueda', 'q');

      if (!isEmpty(busqueda) && String(busqueda).trim().length > 100) {
        throw new Error('La busqueda no puede superar los 100 caracteres.');
      }

      return true;
    }),
  query('fechaDesde')
    .custom((value, { req }) => validarFecha(
      getQueryValue(req, 'fechaDesde', 'fecha_desde'),
      'La fecha desde'
    )),
  query('fechaHasta')
    .custom((value, { req }) => validarFecha(
      getQueryValue(req, 'fechaHasta', 'fecha_hasta'),
      'La fecha hasta'
    )),
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

const validarCrearInscripcion = [
  body('idCurso')
    .custom((value, { req }) => validarEnteroPositivo(
      getBodyValue(req, 'idCurso', 'id_curso'),
      'El curso',
      { required: true }
    )),
  body('idEstudiante')
    .custom((value, { req }) => validarEnteroPositivo(
      getBodyValue(req, 'idEstudiante', 'id_estudiante'),
      'El estudiante',
      { required: true }
    )),
  validarRequest,
];

module.exports = {
  validarListadoInscripciones,
  validarIdInscripcion,
  validarCrearInscripcion,
};
