// Array hardcodeado de cursos
const cursos = [
  { nombre: 'Introducción a JavaScript', descripcion: 'Aprende los fundamentos de JavaScript.', fecha: '2023-10-01' },
  { nombre: 'Desarrollo Web con HTML y CSS', descripcion: 'Crea páginas web atractivas.', fecha: '2023-11-15' },
  { nombre: 'Programación en Python', descripcion: 'Domina Python para desarrollo backend.', fecha: '2023-12-05' },
  { nombre: 'Bases de Datos SQL', descripcion: 'Gestiona datos con SQL.', fecha: '2024-01-20' },
  { nombre: 'React para Principiantes', descripcion: 'Construye interfaces con React.', fecha: '2024-02-10' }
];

// Función para verificar sesión
function verificarSesion() {
  if (localStorage.getItem('userLogged') !== 'true') {
    window.location.href = 'login.html';
  }
}

// Función para renderizar cursos
function renderizarCursos(cursosFiltrados) {
  const grid = document.getElementById('cursosGrid');
  grid.innerHTML = ''; // Limpiar el grid

  cursosFiltrados.forEach(curso => {
    const card = document.createElement('div');
    card.className = 'curso-card';
    card.innerHTML = `
      <h3>${curso.nombre}</h3>
      <p><strong>Descripción:</strong> ${curso.descripcion}</p>
      <p><strong>Fecha:</strong> ${curso.fecha}</p>
    `;
    grid.appendChild(card);
  });
}

// Función para filtrar cursos
function filtrarCursos() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const cursosFiltrados = cursos.filter(curso =>
    curso.nombre.toLowerCase().includes(query)
  );
  renderizarCursos(cursosFiltrados);
}

// Función para logout
function logout() {
  localStorage.removeItem('userLogged');
  window.location.href = 'login.html';
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  verificarSesion();
  renderizarCursos(cursos);

  // Event listener para búsqueda
  document.getElementById('searchInput').addEventListener('input', filtrarCursos);

  // Event listener para logout
  document.getElementById('logoutBtn').addEventListener('click', logout);
});
