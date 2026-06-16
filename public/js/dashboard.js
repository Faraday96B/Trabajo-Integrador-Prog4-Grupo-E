const coursesTotal = document.querySelector("#coursesTotal");
const activeCoursesTotal = document.querySelector("#activeCoursesTotal");
const studentsTotal = document.querySelector("#studentsTotal");
const enrollmentsTotal = document.querySelector("#enrollmentsTotal");
const notificationsTotal = document.querySelector("#notificationsTotal");
const activeCoursesTableBody = document.querySelector("#activeCoursesTableBody");
const recentEnrollmentsTableBody = document.querySelector("#recentEnrollmentsTableBody");

function setText(element, text) {
  if (element) {
    element.textContent = text;
  }
}

async function requestApi(url, options = {}) {
  if (window.apiRequest) {
    return window.apiRequest(url, options);
  }

  const response = await fetch(url, options);
  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || `Error HTTP ${response.status}`);
  }

  return result;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function normalizeCourse(course) {
  return {
    id: course.id,
    nombre: course.nombre ?? "-",
    fechaInicio: course.fechaInicio,
    cantidadHoras: course.cantidadHoras ?? 0,
    inscriptosMax: course.inscriptosMax ?? 0,
    inscriptosConfirmados: course.inscriptosConfirmados ?? 0,
    estado: {
      id: Number(course.estado?.id),
      descripcion: course.estado?.descripcion ?? "-",
      activo: Boolean(course.estado?.activo),
    },
  };
}

function isCourseActive(course) {
  const normalizedCourse = normalizeCourse(course);
  return normalizedCourse.estado.id === 2;
}

function createCourseStatusCell(course) {
  const cell = document.createElement("td");
  const badge = document.createElement("span");

  badge.className = "table-badge success";
  badge.textContent = course.estado.descripcion;
  cell.appendChild(badge);
  return cell;
}

function createActiveCourseRow(course) {
  const normalizedCourse = normalizeCourse(course);
  const row = document.createElement("tr");

  row.append(
    createCell(normalizedCourse.nombre),
    createCell(formatDate(normalizedCourse.fechaInicio)),
    createCell(normalizedCourse.cantidadHoras),
    createCell(normalizedCourse.inscriptosConfirmados),
    createCell(normalizedCourse.inscriptosMax),
    createCourseStatusCell(normalizedCourse)
  );

  return row;
}

function renderActiveCourses(courses) {
  if (!activeCoursesTableBody) {
    return;
  }

  const activeCourses = courses.filter(isCourseActive).slice(0, 5);

  if (!activeCourses.length) {
    const row = document.createElement("tr");
    const cell = createCell("No hay cursos activos para mostrar.");

    cell.colSpan = 6;
    row.appendChild(cell);
    activeCoursesTableBody.replaceChildren(row);
    return;
  }

  activeCoursesTableBody.replaceChildren(...activeCourses.map(createActiveCourseRow));
}

function createEnrollmentStatusCell(enrollment) {
  const cell = document.createElement("td");
  const badge = document.createElement("span");
  const state = enrollment.estado ?? {};
  const stateIsActive = Number(state.id) === 1;

  badge.className = `table-badge ${stateIsActive ? "success" : "muted"}`;
  badge.textContent = state.descripcion ?? "-";
  cell.appendChild(badge);
  return cell;
}

function createRecentEnrollmentRow(enrollment) {
  const row = document.createElement("tr");
  const student = enrollment.estudiante ?? {};
  const course = enrollment.curso ?? {};
  const studentName = `${student.apellido ?? ""}, ${student.nombres ?? ""}`.trim();

  row.append(
    createCell(studentName || "-"),
    createCell(course.nombre ?? "-"),
    createCell(formatDate(enrollment.fechaHoraInscripcion)),
    createEnrollmentStatusCell(enrollment)
  );

  return row;
}

function renderRecentEnrollments(enrollments) {
  if (!recentEnrollmentsTableBody) {
    return;
  }

  if (!enrollments.length) {
    const row = document.createElement("tr");
    const cell = createCell("No hay inscripciones registradas.");

    cell.colSpan = 4;
    row.appendChild(cell);
    recentEnrollmentsTableBody.replaceChildren(row);
    return;
  }

  recentEnrollmentsTableBody.replaceChildren(...enrollments.map(createRecentEnrollmentRow));
}

function renderCourseError(error) {
  setText(coursesTotal, "Error");
  setText(activeCoursesTotal, "Error");

  if (!activeCoursesTableBody) {
    return;
  }

  const row = document.createElement("tr");
  const cell = createCell(`No se pudieron cargar los cursos: ${error.message}`);

  cell.colSpan = 6;
  row.appendChild(cell);
  activeCoursesTableBody.replaceChildren(row);
}

async function loadCourseSummary() {
  try {
    const result = await requestApi("/api/cursos");
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

async function loadEnrollmentSummary() {
  try {
    const result = await requestApi("/api/inscripciones?limite=5");
    const enrollments = Array.isArray(result.data) ? result.data : [];

    setText(enrollmentsTotal, result.meta?.total ?? enrollments.length);
    renderRecentEnrollments(enrollments);
  } catch (error) {
    console.error(error);
    setText(enrollmentsTotal, "Error");

    if (recentEnrollmentsTableBody) {
      const row = document.createElement("tr");
      const cell = createCell(`No se pudieron cargar las inscripciones: ${error.message}`);

      cell.colSpan = 4;
      row.appendChild(cell);
      recentEnrollmentsTableBody.replaceChildren(row);
    }
  }
}

async function loadStudentSummary() {
  try {
    const result = await requestApi("/api/estudiantes?limite=1");

    setText(studentsTotal, result.meta?.total ?? (Array.isArray(result.data) ? result.data.length : 0));
  } catch (error) {
    console.error(error);
    setText(studentsTotal, "Error");
  }
}

function renderPendingMetrics() {
  setText(notificationsTotal, "0");
}

renderPendingMetrics();
loadStudentSummary();
loadCourseSummary();
loadEnrollmentSummary();
