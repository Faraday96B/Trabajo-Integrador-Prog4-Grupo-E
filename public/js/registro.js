// Función para manejar el submit del formulario de registro
document.getElementById('registroForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Evitar el envío por defecto

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorMessage = document.getElementById('errorMessage');

  // Obtener usuarios existentes de localStorage
  let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

  // Verificar si el usuario ya existe
  const usuarioExistente = usuarios.find(user => user.username === username);

  if (usuarioExistente) {
    errorMessage.textContent = 'El usuario ya existe.';
    errorMessage.style.display = 'block';
    return;
  }

  // Verificar que las contraseñas coincidan
  if (password !== confirmPassword) {
    errorMessage.textContent = 'Las contraseñas no coinciden.';
    errorMessage.style.display = 'block';
    return;
  }

  // Agregar nuevo usuario
  usuarios.push({ username, password });
  localStorage.setItem('usuarios', JSON.stringify(usuarios));

  // Redirigir a login
  window.location.href = 'login.html';
});