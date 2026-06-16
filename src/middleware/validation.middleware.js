const { validationResult } = require('express-validator');

function validarRequest(req, res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    ok: false,
    message: 'Los datos enviados no son validos.',
    errors: errors.array().map((error) => ({
      campo: error.path,
      mensaje: error.msg,
    })),
  });
}

module.exports = {
  validarRequest,
};
