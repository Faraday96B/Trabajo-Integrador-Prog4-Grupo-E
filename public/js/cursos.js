const coursesTableBody = document.querySelector("#coursesTableBody");

const fallbackCourses = [
  {
    idCurso: 1,
    nombre: "Programacion Web con React",
    fechaInicio: "2026-04-20T03:00:00.000Z",
    cantidadHoras: 60,
    inscriptosMax: 30,
    estado: "BORRADOR"
  },
  {
    idCurso: 2,
    nombre: "Introduccion a la Inteligencia Artificial",
    fechaInicio: "2026-05-05T03:00:00.000Z",
    cantidadHoras: 50,
    inscriptosMax: 25,
    estado: "BORRADOR"
  },
  {
    idCurso: 3,
    nombre: "Seguridad Informatica y Ethical Hacking",
    fechaInicio: "2026-05-10T03:00:00.000Z",
    cantidadHoras: 70,
    inscriptosMax: 20,
    estado: "BORRADOR"
  },
  {
    idCurso: 4,
    nombre: "Bases de Datos SQL y NoSQL",
    fechaInicio: "2026-04-25T03:00:00.000Z",
    cantidadHoras: 55,
    inscriptosMax: 35,
    estado: "BORRADOR"
  },
  {
    idCurso: 5,
    nombre: "Desarrollo Backend con Node.js y NestJS",
    fechaInicio: "2026-05-15T03:00:00.000Z",
    cantidadHoras: 65,
    inscriptosMax: 30,
    estado: "BORRADOR"
  }
];

function fixText(value) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function normalizeCourse(course) {
  return {
    id: course.idCurso ?? course.id_curso ?? "-",
    nombre: course.nombre ?? "-",
    fechaInicio: course.fechaInicio ?? course.fecha_inicio,
    cantidadHoras: course.cantidadHoras ?? course.cantidad_horas ?? "-",
    inscriptosMax: course.inscriptosMax ?? course.inscriptos_max ?? "-",
    estado: course.estado ?? course.curso_estado_descripcion ?? "-"
  };
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function createStatusCell(statusText) {
  const cell = document.createElement("td");
  const badge = document.createElement("span");
  badge.className = "status-badge";
  badge.textContent = fixText(statusText);
  cell.appendChild(badge);
  return cell;
}

function createActionsCell(courseId) {
  const cell = document.createElement("td");
  const actions = document.createElement("div");
  actions.className = "table-actions";

  const editButton = document.createElement("button");
  editButton.className = "action-button edit";
  editButton.type = "button";
  editButton.dataset.id = courseId;
  editButton.textContent = "Editar";

  const deleteButton = document.createElement("button");
  deleteButton.className = "action-button delete";
  deleteButton.type = "button";
  deleteButton.dataset.id = courseId;
  deleteButton.textContent = "Eliminar";

  actions.append(editButton, deleteButton);
  cell.appendChild(actions);
  return cell;
}

function createCourseRow(course) {
  const normalizedCourse = normalizeCourse(course);
  const row = document.createElement("tr");

  row.append(
    createCell(normalizedCourse.id),
    createCell(fixText(normalizedCourse.nombre)),
    createCell(formatDate(normalizedCourse.fechaInicio)),
    createCell(normalizedCourse.cantidadHoras),
    createCell(normalizedCourse.inscriptosMax),
    createStatusCell(normalizedCourse.estado),
    createActionsCell(normalizedCourse.id)
  );

  return row;
}

function getCoursesFromResponse(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function renderCourses(courses) {
  coursesTableBody.replaceChildren(...courses.map(createCourseRow));
}

async function fetchCoursesFrom(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url}`);
  }

  return getCoursesFromResponse(await response.json());
}

async function loadCourses() {
  try {
    const courses = await fetchCoursesFrom("/cursos");
    renderCourses(courses);
  } catch {
    try {
      const courses = await fetchCoursesFrom("../js/cursos.json");
      renderCourses(courses);
    } catch {
      renderCourses(fallbackCourses);
    }
  }
}

if (coursesTableBody) {
  loadCourses();
}
