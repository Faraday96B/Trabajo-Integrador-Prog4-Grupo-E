const coursesGrid = document.querySelector("#coursesGrid");

const fallbackCourses = [
  {
    nombre: "Programacion Web con React",
    fechaInicio: "2026-04-20T03:00:00.000Z",
    cantidadHoras: 60,
    inscriptosMax: 30,
    estado: "BORRADOR"
  },
  {
    nombre: "Introduccion a la Inteligencia Artificial",
    fechaInicio: "2026-05-05T03:00:00.000Z",
    cantidadHoras: 50,
    inscriptosMax: 25,
    estado: "BORRADOR"
  },
  {
    nombre: "Seguridad Informatica y Ethical Hacking",
    fechaInicio: "2026-05-10T03:00:00.000Z",
    cantidadHoras: 70,
    inscriptosMax: 20,
    estado: "BORRADOR"
  },
  {
    nombre: "Bases de Datos SQL y NoSQL",
    fechaInicio: "2026-04-25T03:00:00.000Z",
    cantidadHoras: 55,
    inscriptosMax: 35,
    estado: "BORRADOR"
  },
  {
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

function createCourseCard(course) {
  const article = document.createElement("article");
  article.className = "course-card";

  const title = document.createElement("h3");
  title.textContent = fixText(course.nombre);

  const date = document.createElement("p");
  date.innerHTML = `<strong>Fecha de inicio:</strong> ${formatDate(course.fechaInicio)}`;

  const hours = document.createElement("p");
  hours.innerHTML = `<strong>Cantidad de horas:</strong> ${course.cantidadHoras ?? "-"}`;

  const maxStudents = document.createElement("p");
  maxStudents.innerHTML = `<strong>Inscriptos maximos:</strong> ${course.inscriptosMax ?? "-"}`;

  const status = document.createElement("p");
  status.innerHTML = `<strong>Estado:</strong> <span class="status-badge">${fixText(course.estado ?? "-")}</span>`;

  article.append(title, date, hours, maxStudents, status);
  return article;
}

function renderCourses(courses) {
  coursesGrid.replaceChildren(...courses.map(createCourseCard));
}

async function loadCourses() {
  try {
    const response = await fetch("../js/cursos.json");

    if (!response.ok) {
      throw new Error("No se pudo cargar cursos.json");
    }

    const courses = await response.json();
    renderCourses(courses);
  } catch {
    renderCourses(fallbackCourses);
  }
}

if (coursesGrid) {
  loadCourses();
}
