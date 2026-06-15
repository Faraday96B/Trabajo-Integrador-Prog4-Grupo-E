const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuario.model');
const { JWT_SECRET, JWT_EXPIRES_IN, crearPayloadUsuario } = require('../config/jwt');

function hashContrasenia(contrasenia) {
  return crypto.createHash('sha256').update(contrasenia).digest('hex');
}

function toUsuarioResponse(usuario) {
  if (!usuario) {
    return null;
  }

  return {
    idUsuario: usuario.idUsuario,
    nombreUsuario: usuario.nombreUsuario,
    apellido: usuario.apellido,
    nombre: usuario.nombre,
  };
}

async function validarCredenciales(nombreUsuario, contrasenia) {
  const usuario = await usuarioModel.obtenerPorNombreUsuario(nombreUsuario);

  if (!usuario || !usuario.activo) {
    return null;
  }

  const contraseniaHash = hashContrasenia(contrasenia);

  if (contraseniaHash !== usuario.contrasenia) {
    return null;
  }

  return toUsuarioResponse(usuario);
}

function generarToken(usuario) {
  return jwt.sign(crearPayloadUsuario(usuario), JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

async function iniciarSesion(usuario) {
  const usuarioResponse = toUsuarioResponse(usuario);

  return {
    ok: true,
    message: 'Inicio de sesion correcto.',
    data: {
      token: generarToken(usuarioResponse),
      usuario: usuarioResponse,
    },
  };
}

function usuarioActual(usuario) {
  return {
    ok: true,
    message: 'Usuario autenticado.',
    data: {
      usuario: toUsuarioResponse(usuario),
    },
  };
}

module.exports = {
  validarCredenciales,
  iniciarSesion,
  usuarioActual,
  toUsuarioResponse,
};
