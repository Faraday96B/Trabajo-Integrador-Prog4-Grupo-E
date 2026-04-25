// Función para manejar el submit del formulario de login
document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault(); // Evitar el envío por defecto

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  // Obtener usuarios de localStorage
  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

  // Verificar si hay usuarios registrados
  if (usuarios.length === 0) {
    errorMessage.textContent = 'No hay usuarios registrados. Regístrate primero.';
    errorMessage.style.display = 'block';
    return;
  }

  // Buscar usuario
  const usuario = usuarios.find(user => user.username === username && user.password === password);

  if (usuario) {
    // Guardar en localStorage
    localStorage.setItem('userLogged', 'true');
    localStorage.setItem('currentUser', username);
    // Redirigir a cursos.html
    window.location.href = 'cursos.html';
  } else {
    // Mostrar mensaje de error
    errorMessage.textContent = 'Usuario o contraseña incorrectos.';
    errorMessage.style.display = 'block';
  }
});
