const coursesTableBody = document.querySelector("#coursesTableBody");
const nameFilter = document.querySelector("#courseNameFilter");
const statusFilter = document.querySelector("#courseStatusFilter");
const enrollmentFilter = document.querySelector("#courseEnrollmentFilter");
const searchButton = document.querySelector("#searchCourses");
const clearButton = document.querySelector("#clearCourses");
const resultsText = document.querySelector("#coursesResults");
const courseForm = document.querySelector(".course-form");
const courseNameInput = document.querySelector("#courseName");
const courseDescriptionInput = document.querySelector("#courseDescription");
const courseStartDateInput = document.querySelector("#courseStartDate");
const courseEndDateInput = document.querySelector("#courseEndDate");
const courseEnrollmentEnabledInput = document.querySelector("#courseEnrollmentEnabled");
const courseCapacityInput = document.querySelector("#courseCapacity");
const courseStatusInput = document.querySelector("#courseStatus");
const courseFormHeading = document.querySelector(".course-form-heading h1");
const courseFormIntro = document.querySelector(".course-form-heading p");

const coursesStorageKey = "fcadCursos";

let allCourses = [];
let editingCourseId = null;

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
    timeZone: "UTC"
  });
}

function formatDateForInput(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function addDays(value, days) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getStatusKey(statusText) {
  const normalizedStatus = statusText.toLowerCase();

  if (normalizedStatus.includes("inactivo")) {
    return "inactivo";
  }

  if (normalizedStatus.includes("borrador")) {
    return "borrador";
  }

  return "activo";
}

function normalizeCourse(course, index) {
  const startDate = course.fechaInicio ?? course.fecha_inicio;
  const statusText = fixText(course.estado ?? course.curso_estado_descripcion ?? "BORRADOR");

  return {
    id: course.idCurso ?? course.id_curso ?? index + 1,
    idCurso: course.idCurso ?? course.id_curso ?? index + 1,
    nombre: fixText(course.nombre ?? "-"),
    descripcion: fixText(course.descripcion ?? ""),
    fechaInicio: startDate,
    fechaFin: course.fechaFin ?? course.fecha_fin ?? addDays(startDate, 90),
    cupoMax: course.inscriptosMax ?? course.inscriptos_max ?? 0,
    inscriptos: course.inscriptosConfirmados ?? course.inscriptos_confirmados ?? 0,
    estado: statusText,
    estadoKey: getStatusKey(statusText)
  };
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function createStatusCell(course) {
  const cell = document.createElement("td");
  const badge = document.createElement("span");
  const statusClass = course.estadoKey === "inactivo"
    ? "inactive"
    : course.estadoKey === "borrador"
      ? "draft"
      : "active";

  badge.className = `course-state-badge ${statusClass}`;
  badge.textContent = course.estado;
  cell.appendChild(badge);
  return cell;
}

function createIconButton(className, label, iconPath, courseId) {
  const button = document.createElement("button");
  button.className = `course-icon-button ${className}`;
  button.type = "button";
  button.dataset.id = courseId;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPath}"/></svg>`;
  return button;
}

function createActionsCell(course) {
  const cell = document.createElement("td");
  const actions = document.createElement("div");
  actions.className = "course-actions";

  actions.append(
    createIconButton("view", "Ver curso", "M12 5c5 0 9 5.5 9 7s-4 7-9 7-9-5.5-9-7 4-7 9-7Zm0 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z", course.idCurso),
    createIconButton("edit", "Editar curso", "M4 17.2V21h3.8L18.9 9.9l-3.8-3.8L4 17.2ZM20.7 8.1a1 1 0 0 0 0-1.4l-3.4-3.4a1 1 0 0 0-1.4 0l-1.4 1.4 4.8 4.8 1.4-1.4Z", course.idCurso),
    createIconButton("delete", "Eliminar curso", "M7 21a2 2 0 0 1-2-2V7h14v12a2 2 0 0 1-2 2H7ZM9 4h6l1 2h5v2H3V6h5l1-2Zm0 7v6h2v-6H9Zm4 0v6h2v-6h-2Z", course.idCurso)
  );

  cell.appendChild(actions);
  return cell;
}

function createCourseRow(course, index) {
  const normalizedCourse = normalizeCourse(course, index);
  const row = document.createElement("tr");
  row.dataset.id = normalizedCourse.idCurso;

  row.append(
    createCell(normalizedCourse.id),
    createCell(normalizedCourse.nombre),
    createCell(formatDate(normalizedCourse.fechaInicio)),
    createCell(formatDate(normalizedCourse.fechaFin)),
    createCell(normalizedCourse.cupoMax),
    createCell(normalizedCourse.inscriptos),
    createStatusCell(normalizedCourse),
    createActionsCell(normalizedCourse)
  );

  return row;
}

function saveCourses(courses) {
  localStorage.setItem(coursesStorageKey, JSON.stringify(courses));
}

function getStoredCourses() {
  const storedCourses = localStorage.getItem(coursesStorageKey);

  if (!storedCourses) {
    return null;
  }

  try {
    const courses = JSON.parse(storedCourses);
    return Array.isArray(courses) ? courses : null;
  } catch {
    return null;
  }
}

async function getJsonCourses() {
  const response = await fetch("../js/cursos.json");

  if (!response.ok) {
    throw new Error("No se pudo cargar cursos.json");
  }

  const courses = await response.json();
  return Array.isArray(courses) ? courses : [];
}

async function loadCourses() {
  const storedCourses = getStoredCourses();

  if (storedCourses) {
    allCourses = storedCourses;
  } else {
    allCourses = await getJsonCourses();
    saveCourses(allCourses);
  }

  renderCourses(applyFilters());
}

function applyFilters() {
  const search = nameFilter?.value.trim().toLowerCase() ?? "";
  const status = statusFilter?.value ?? "";
  const enrollment = enrollmentFilter?.value ?? "";

  return allCourses.filter((course, index) => {
    const normalizedCourse = normalizeCourse(course, index);
    const hasCapacity = Number(normalizedCourse.inscriptos) < Number(normalizedCourse.cupoMax);

    return normalizedCourse.nombre.toLowerCase().includes(search)
      && (!status || normalizedCourse.estadoKey === status)
      && (
        !enrollment
        || (enrollment === "con-cupo" && hasCapacity)
        || (enrollment === "sin-cupo" && !hasCapacity)
      );
  });
}

function renderCourses(courses) {
  if (!coursesTableBody) {
    return;
  }

  coursesTableBody.replaceChildren(...courses.map(createCourseRow));

  if (resultsText) {
    const total = courses.length;
    resultsText.textContent = total === 0
      ? "Mostrando 0 resultados"
      : `Mostrando 1 a ${total} de ${total} resultados`;
  }
}

function findCourseById(id) {
  return allCourses.find((course, index) => String(normalizeCourse(course, index).idCurso) === String(id));
}

function showCourse(id) {
  const course = findCourseById(id);

  if (!course) {
    alert("No se encontro el curso.");
    return;
  }

  const normalizedCourse = normalizeCourse(course, 0);
  alert(`${normalizedCourse.nombre}\nInicio: ${formatDate(normalizedCourse.fechaInicio)}\nFin: ${formatDate(normalizedCourse.fechaFin)}\nCupo: ${normalizedCourse.cupoMax}\nEstado: ${normalizedCourse.estado}`);
}

function deleteCourse(id) {
  const confirmed = confirm("Seguro que queres eliminar este curso?");

  if (!confirmed) {
    return;
  }

  allCourses = allCourses.filter((course, index) => String(normalizeCourse(course, index).idCurso) !== String(id));
  saveCourses(allCourses);
  renderCourses(applyFilters());
}

function getNextCourseId() {
  return allCourses.reduce((maxId, course, index) => {
    const courseId = Number(normalizeCourse(course, index).idCurso);
    return Number.isNaN(courseId) ? maxId : Math.max(maxId, courseId);
  }, 0) + 1;
}

function getCourseFormData() {
  return {
    idCurso: editingCourseId ? Number(editingCourseId) : getNextCourseId(),
    nombre: courseNameInput?.value.trim() ?? "",
    descripcion: courseDescriptionInput?.value.trim() ?? "",
    fechaInicio: courseStartDateInput?.value ? `${courseStartDateInput.value}T03:00:00.000Z` : "",
    fechaFin: courseEndDateInput?.value ? `${courseEndDateInput.value}T03:00:00.000Z` : "",
    inscripcionHabilitada: courseEnrollmentEnabledInput?.value ?? "si",
    inscriptosMax: Number(courseCapacityInput?.value ?? 0),
    inscriptosConfirmados: 0,
    estado: (courseStatusInput?.value ?? "borrador").toUpperCase()
  };
}

function fillCourseForm(course) {
  const normalizedCourse = normalizeCourse(course, 0);

  courseNameInput.value = normalizedCourse.nombre === "-" ? "" : normalizedCourse.nombre;
  courseDescriptionInput.value = normalizedCourse.descripcion;
  courseStartDateInput.value = formatDateForInput(normalizedCourse.fechaInicio);
  courseEndDateInput.value = formatDateForInput(normalizedCourse.fechaFin);
  courseEnrollmentEnabledInput.value = course.inscripcionHabilitada ?? "si";
  courseCapacityInput.value = normalizedCourse.cupoMax;
  courseStatusInput.value = normalizedCourse.estadoKey;
}

async function setupCourseForm() {
  if (!courseForm) {
    return;
  }

  await loadCourses();

  const params = new URLSearchParams(window.location.search);
  editingCourseId = params.get("id");

  if (!editingCourseId) {
    return;
  }

  const course = findCourseById(editingCourseId);

  if (!course) {
    alert("No se encontro el curso.");
    window.location.href = "cursos.html";
    return;
  }

  fillCourseForm(course);

  if (courseFormHeading) {
    courseFormHeading.textContent = "Editar Curso";
  }

  if (courseFormIntro) {
    courseFormIntro.textContent = "Actualice los datos del curso";
  }
}

function saveCourse(event) {
  event.preventDefault();

  const course = getCourseFormData();

  if (!course.nombre || !course.fechaInicio || !course.fechaFin || course.inscriptosMax <= 0) {
    alert("Complete los campos obligatorios del curso.");
    return;
  }

  if (editingCourseId) {
    allCourses = allCourses.map((currentCourse, index) => {
      const normalizedCourse = normalizeCourse(currentCourse, index);

      if (String(normalizedCourse.idCurso) !== String(editingCourseId)) {
        return currentCourse;
      }

      return {
        ...currentCourse,
        ...course,
        inscriptosConfirmados: currentCourse.inscriptosConfirmados ?? currentCourse.inscriptos_confirmados ?? 0
      };
    });
  } else {
    allCourses = [...allCourses, course];
  }

  saveCourses(allCourses);
  window.location.href = "cursos.html";
}

function handleTableClick(event) {
  const button = event.target.closest("button");

  if (!button?.dataset.id) {
    return;
  }

  if (button.classList.contains("edit")) {
    window.location.href = `curso-form.html?id=${encodeURIComponent(button.dataset.id)}`;
  } else if (button.classList.contains("delete")) {
    deleteCourse(button.dataset.id);
  } else if (button.classList.contains("view")) {
    showCourse(button.dataset.id);
  }
}

function clearFilters() {
  if (nameFilter) {
    nameFilter.value = "";
  }

  if (statusFilter) {
    statusFilter.value = "";
  }

  if (enrollmentFilter) {
    enrollmentFilter.value = "";
  }

  renderCourses(applyFilters());
}

searchButton?.addEventListener("click", () => renderCourses(applyFilters()));
clearButton?.addEventListener("click", clearFilters);
nameFilter?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    renderCourses(applyFilters());
  }
});
coursesTableBody?.addEventListener("click", handleTableClick);
courseForm?.addEventListener("submit", saveCourse);

if (coursesTableBody) {
  loadCourses().catch((error) => {
    console.error(error);
    renderCourses([]);
  });
}

if (courseForm) {
  setupCourseForm().catch(console.error);
}
