const passport = require('passport');
const authService = require('../services/auth.service');

function login(req, res, next) {
  req.body.nombreUsuario = req.body.nombreUsuario ?? req.body.nombre_usuario;
  req.body.contrasenia = req.body.contrasenia ?? req.body.password;

  return passport.authenticate('local', { session: false }, async (error, usuario, info) => {
    try {
      if (error) {
        return next(error);
      }

      if (!usuario) {
        return res.status(401).json({
          ok: false,
          message: info?.message || 'Usuario o contrasenia incorrectos.',
        });
      }

      const result = await authService.iniciarSesion(usuario);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  })(req, res, next);
}

function me(req, res) {
  const result = authService.usuarioActual(req.user);
  return res.status(200).json(result);
}

function logout(req, res) {
  return res.status(200).json({
    ok: true,
    message: 'Sesion cerrada correctamente.',
    data: null,
  });
}

module.exports = {
  login,
  me,
  logout,
};
