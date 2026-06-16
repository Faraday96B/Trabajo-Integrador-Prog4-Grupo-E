const coursesTotal = document.querySelector('#coursesTotal');
const activeCoursesTotal = document.querySelector('#activeCoursesTotal');
const studentsTotal = document.querySelector('#studentsTotal');
const enrollmentsTotal = document.querySelector('#enrollmentsTotal');
const notificationsTotal = document.querySelector('#notificationsTotal');
const activeCoursesTableBody = document.querySelector('#activeCoursesTableBody');
const recentEnrollmentsTableBody = document.querySelector('#recentEnrollmentsTableBody');

function setText(element, text) {
  if (element) {
    element.textContent = text;
  }
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function normalizeCourse(course) {
  return {
    id: course.id,
    nombre: course.nombre ?? '-',
    fechaInicio: course.fechaInicio,
    cantidadHoras: course.cantidadHoras ?? 0,
    inscriptosMax: course.inscriptosMax ?? 0,
    inscriptosConfirmados: course.inscriptosConfirmados ?? 0,
    estado: {
      id: Number(course.estado?.id),
      descripcion: course.estado?.descripcion ?? '-',
      activo: Boolean(course.estado?.activo),
    },
  };
}

function isCourseActive(course) {
  const normalizedCourse = normalizeCourse(course);
  return normalizedCourse.estado.activo && normalizedCourse.estado.id !== 4;
}

function createCell(text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  return cell;
}

function createStatusCell(course) {
  const cell = document.createElement('td');
  const badge = document.createElement('span');
  const estadoId = Number(course.estado.id);

  badge.className = estadoId === 4 ? 'table-badge muted' : 'table-badge success';
  badge.textContent = course.estado.descripcion;
  cell.appendChild(badge);
  return cell;
}

function renderActiveCourses(courses) {
  if (!activeCoursesTableBody) {
    return;
  }

  const activeCourses = courses.filter(isCourseActive).slice(0, 5).map(normalizeCourse);

  if (activeCourses.length === 0) {
    const row = document.createElement('tr');
    const cell = createCell('No hay cursos activos para mostrar.');
    cell.colSpan = 6;
    row.appendChild(cell);
    activeCoursesTableBody.replaceChildren(row);
    return;
  }

  const rows = activeCourses.map((course) => {
    const row = document.createElement('tr');

    row.append(
      createCell(course.nombre),
      createCell(formatDate(course.fechaInicio)),
      createCell(course.cantidadHoras),
      createCell(course.inscriptosConfirmados),
      createCell(course.inscriptosMax),
      createStatusCell(course)
    );

    return row;
  });

  activeCoursesTableBody.replaceChildren(...rows);
}

function renderPendingEnrollments() {
  if (!recentEnrollmentsTableBody) {
    return;
  }

  const row = document.createElement('tr');
  const cell = createCell('Modulo de inscripciones pendiente de implementacion.');
  cell.colSpan = 4;
  row.appendChild(cell);
  recentEnrollmentsTableBody.replaceChildren(row);
}

function renderCourseError(error) {
  setText(coursesTotal, 'Error');
  setText(activeCoursesTotal, 'Error');

  if (!activeCoursesTableBody) {
    return;
  }

  const row = document.createElement('tr');
  const cell = createCell(`No se pudieron cargar los cursos: ${error.message}`);
  cell.colSpan = 6;
  row.appendChild(cell);
  activeCoursesTableBody.replaceChildren(row);
}

async function loadDashboardCourses() {
  try {
    const result = await window.apiRequest('/api/cursos');
    const courses = Array.isArray(result.data) ? result.data : [];
    const activeCourses = courses.filter(isCourseActive);

    setText(coursesTotal, courses.length);
    setText(activeCoursesTotal, activeCourses.length);
    renderActiveCourses(courses);
  } catch (error) {
    console.error(error);
    renderCourseError(error);
  }
}

function renderPendingMetrics() {
  setText(studentsTotal, 'Pendiente');
  setText(enrollmentsTotal, 'Pendiente');
  setText(notificationsTotal, '0');
  renderPendingEnrollments();
}

renderPendingMetrics();
loadDashboardCourses();
