const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const authService = require('../services/auth.service');
const usuarioModel = require('../models/usuario.model');
const { JWT_SECRET } = require('../config/jwt');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'nombreUsuario',
      passwordField: 'contrasenia',
      session: false,
    },
    async (nombreUsuario, contrasenia, done) => {
      try {
        const usuario = await authService.validarCredenciales(nombreUsuario, contrasenia);

        if (!usuario) {
          return done(null, false, { message: 'Usuario o contrasenia incorrectos.' });
        }

        return done(null, usuario);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const usuario = await usuarioModel.obtenerActivoPorId(payload.idUsuario);

        if (!usuario) {
          return done(null, false);
        }

        return done(null, {
          idUsuario: payload.idUsuario,
          nombreUsuario: payload.nombreUsuario,
          apellido: payload.apellido,
          nombre: payload.nombre,
        });
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

function verificarJWT(req, res, next) {
  return passport.authenticate('jwt', { session: false }, (error, usuario) => {
    if (error) {
      return next(error);
    }

    if (!usuario) {
      return res.status(401).json({
        ok: false,
        message: 'No autorizado. Inicie sesion nuevamente.',
      });
    }

    req.user = usuario;
    return next();
  })(req, res, next);
}

module.exports = {
  passport,
  verificarJWT,
};
