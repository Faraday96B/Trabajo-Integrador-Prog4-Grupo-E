require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'desarrollo-jwt-secret-cambiar';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

function crearPayloadUsuario(usuario) {
  return {
    idUsuario: usuario.idUsuario,
    nombreUsuario: usuario.nombreUsuario,
    apellido: usuario.apellido,
    nombre: usuario.nombre,
  };
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  crearPayloadUsuario,
};
