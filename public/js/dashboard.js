const totalCoursesText = document.querySelector("#dashboardTotalCourses");
const activeCoursesText = document.querySelector("#dashboardActiveCourses");
const totalEnrollmentsText = document.querySelector("#dashboardTotalEnrollments");
const activeCoursesTableBody = document.querySelector("#activeCoursesTableBody");
const recentEnrollmentsTableBody = document.querySelector("#recentEnrollmentsTableBody");

const COURSE_STATE_OPEN = 2;

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
  });
}

function createRecentEnrollmentRow(enrollment) {
  const row = document.createElement("tr");
  const student = enrollment.estudiante ?? {};
  const course = enrollment.curso ?? {};
  const state = enrollment.estado ?? {};
  const studentName = `${student.apellido ?? ""}, ${student.nombres ?? ""}`.trim();
  const stateIsActive = Number(state.id) === 1;
  const studentCell = document.createElement("td");
  const courseCell = document.createElement("td");
  const dateCell = document.createElement("td");
  const stateCell = document.createElement("td");
  const badge = document.createElement("span");

  studentCell.textContent = studentName || "-";
  courseCell.textContent = course.nombre ?? "-";
  dateCell.textContent = formatDate(enrollment.fechaHoraInscripcion);
  badge.className = `table-badge ${stateIsActive ? "success" : "muted"}`;
  badge.textContent = state.descripcion ?? "-";
  stateCell.appendChild(badge);

  row.append(studentCell, courseCell, dateCell, stateCell);
  return row;
}

function createActiveCourseRow(course) {
  const row = document.createElement("tr");
  const state = course.estado ?? {};
  const stateCell = document.createElement("td");
  const badge = document.createElement("span");

  row.append(
    createTextCell(course.nombre ?? "-"),
    createTextCell(formatDate(course.fechaInicio)),
    createTextCell(course.cantidadHoras ?? "-"),
    createTextCell(course.inscriptosConfirmados ?? 0),
    createTextCell(course.inscriptosMax ?? "-")
  );

  badge.className = "table-badge success";
  badge.textContent = state.descripcion ?? "Inscripcion abierta";
  stateCell.appendChild(badge);
  row.appendChild(stateCell);

  return row;
}

function createTextCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function getOpenCourses(courses = []) {
  return courses.filter((course) => Number(course.estado?.id) === COURSE_STATE_OPEN);
}

function renderActiveCourses(courses) {
  if (!activeCoursesTableBody) {
    return;
  }

  if (!courses.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="6">No hay cursos con inscripcion abierta.</td>';
    activeCoursesTableBody.replaceChildren(row);
    return;
  }

  activeCoursesTableBody.replaceChildren(...courses.slice(0, 5).map(createActiveCourseRow));
}

function renderRecentEnrollments(enrollments) {
  if (!recentEnrollmentsTableBody) {
    return;
  }

  if (!enrollments.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="4">No hay inscripciones registradas.</td>';
    recentEnrollmentsTableBody.replaceChildren(row);
    return;
  }

  recentEnrollmentsTableBody.replaceChildren(...enrollments.map(createRecentEnrollmentRow));
}

async function loadCourseSummary() {
  if (!totalCoursesText && !activeCoursesText && !activeCoursesTableBody) {
    return;
  }

  try {
    const result = await requestApi("/api/cursos");
    const courses = Array.isArray(result.data) ? result.data : [];
    const openCourses = getOpenCourses(courses);

    if (totalCoursesText) {
      totalCoursesText.textContent = String(courses.length);
    }

    if (activeCoursesText) {
      activeCoursesText.textContent = String(openCourses.length);
    }

    renderActiveCourses(openCourses);
  } catch (error) {
    console.error(error);

    if (totalCoursesText) {
      totalCoursesText.textContent = "-";
    }

    if (activeCoursesText) {
      activeCoursesText.textContent = "-";
    }

    if (activeCoursesTableBody) {
      const row = document.createElement("tr");
      row.innerHTML = '<td colspan="6">No se pudieron cargar los cursos.</td>';
      activeCoursesTableBody.replaceChildren(row);
    }
  }
}

async function loadEnrollmentSummary() {
  if (!totalEnrollmentsText && !recentEnrollmentsTableBody) {
    return;
  }

  try {
    const result = await requestApi("/api/inscripciones?limite=5");

    if (totalEnrollmentsText) {
      totalEnrollmentsText.textContent = String(result.meta?.total ?? result.data?.length ?? 0);
    }

    renderRecentEnrollments(Array.isArray(result.data) ? result.data : []);
  } catch (error) {
    console.error(error);

    if (totalEnrollmentsText) {
      totalEnrollmentsText.textContent = "-";
    }
  }
}

loadCourseSummary();
loadEnrollmentSummary();
