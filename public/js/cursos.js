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
const courseHoursInput = document.querySelector("#courseHours");
const courseCapacityInput = document.querySelector("#courseCapacity");
const courseStatusInput = document.querySelector("#courseStatus");
const courseFormHeading = document.querySelector(".course-form-heading h1");
const courseFormIntro = document.querySelector(".course-form-heading p");

let allCourses = [];
let editingCourseId = null;

async function requestApi(url, options = {}) {
  if (window.apiRequest) {
    return window.apiRequest(url, options);
  }

  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `Error HTTP ${response.status}`);
  }

  if (!result?.ok) {
    throw new Error(result?.message || "La API respondio con error.");
  }

  return result;
}

function setLoading(message = "Cargando cursos...") {
  if (resultsText) {
    resultsText.textContent = message;
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
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeCourse(course) {
  return {
    id: course.id,
    nombre: course.nombre ?? "-",
    descripcion: course.descripcion ?? "",
    fechaInicio: course.fechaInicio,
    cantidadHoras: course.cantidadHoras ?? 0,
    inscriptosMax: course.inscriptosMax ?? 0,
    inscriptosConfirmados: course.inscriptosConfirmados ?? 0,
    estado: {
      id: course.estado?.id,
      descripcion: course.estado?.descripcion ?? "-",
      activo: course.estado?.activo ?? false
    }
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
  const estadoId = Number(course.estado.id);
  const statusClass = estadoId === 4
    ? "inactive"
    : estadoId === 1
      ? "draft"
      : "active";

  badge.className = `course-state-badge ${statusClass}`;
  badge.textContent = course.estado.descripcion;
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

  const viewButton = createIconButton("view", "Ver curso", "M12 5c5 0 9 5.5 9 7s-4 7-9 7-9-5.5-9-7 4-7 9-7Zm0 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z", course.id);
  const editButton = createIconButton("edit", "Editar curso", "M4 17.2V21h3.8L18.9 9.9l-3.8-3.8L4 17.2ZM20.7 8.1a1 1 0 0 0 0-1.4l-3.4-3.4a1 1 0 0 0-1.4 0l-1.4 1.4 4.8 4.8 1.4-1.4Z", course.id);
  const deleteButton = createIconButton("delete", "Eliminar curso", "M7 21a2 2 0 0 1-2-2V7h14v12a2 2 0 0 1-2 2H7ZM9 4h6l1 2h5v2H3V6h5l1-2Zm0 7v6h2v-6H9Zm4 0v6h2v-6h-2Z", course.id);

  if (Number(course.estado.id) === 4) {
    editButton.disabled = true;
    deleteButton.disabled = true;
  }

  actions.append(viewButton, editButton, deleteButton);
  cell.appendChild(actions);
  return cell;
}

function createCourseRow(course) {
  const normalizedCourse = normalizeCourse(course);
  const row = document.createElement("tr");
  row.dataset.id = normalizedCourse.id;

  row.append(
    createCell(normalizedCourse.id),
    createCell(normalizedCourse.nombre),
    createCell(formatDate(normalizedCourse.fechaInicio)),
    createCell(normalizedCourse.cantidadHoras),
    createCell(normalizedCourse.inscriptosMax),
    createCell(normalizedCourse.inscriptosConfirmados),
    createStatusCell(normalizedCourse),
    createActionsCell(normalizedCourse)
  );

  return row;
}

function applyClientFilters(courses) {
  const enrollment = enrollmentFilter?.value ?? "";

  if (!enrollment) {
    return courses;
  }

  return courses.filter((course) => {
    const normalizedCourse = normalizeCourse(course);
    const hasCapacity = Number(normalizedCourse.inscriptosConfirmados) < Number(normalizedCourse.inscriptosMax);
    return enrollment === "con-cupo" ? hasCapacity : !hasCapacity;
  });
}

function renderCourses(courses) {
  if (!coursesTableBody) {
    return;
  }

  const rows = courses.map(createCourseRow);
  coursesTableBody.replaceChildren(...rows);

  if (resultsText) {
    const total = courses.length;
    resultsText.textContent = total === 0
      ? "Mostrando 0 resultados"
      : `Mostrando 1 a ${total} de ${total} resultados`;
  }
}

function buildCourseQuery() {
  const params = new URLSearchParams();
  const name = nameFilter?.value.trim();
  const status = statusFilter?.value;

  if (name) {
    params.set("nombre", name);
  }

  if (status) {
    params.set("estado", status);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function loadCourses() {
  setLoading();

  try {
    const result = await requestApi(`/api/cursos${buildCourseQuery()}`);
    allCourses = Array.isArray(result.data) ? result.data : [];
    renderCourses(applyClientFilters(allCourses));
  } catch (error) {
    console.error(error);
    allCourses = [];
    renderCourses([]);
    alert(`No se pudieron cargar los cursos: ${error.message}`);
  }
}

async function findCourseById(id) {
  const result = await requestApi(`/api/cursos/${id}`);
  return result.data;
}

async function showCourse(id) {
  try {
    const course = normalizeCourse(await findCourseById(id));
    alert(`${course.nombre}\nDescripcion: ${course.descripcion || "-"}\nInicio: ${formatDate(course.fechaInicio)}\nHoras: ${course.cantidadHoras}\nCupo: ${course.inscriptosMax}\nInscriptos: ${course.inscriptosConfirmados}\nEstado: ${course.estado.descripcion}`);
  } catch (error) {
    console.error(error);
    alert(`No se pudo cargar el curso: ${error.message}`);
  }
}

async function deleteCourse(id) {
  const confirmed = confirm("Seguro que queres eliminar este curso?");

  if (!confirmed) {
    return;
  }

  try {
    const result = await requestApi(`/api/cursos/${id}`, { method: "DELETE" });
    alert(result.message);
    await loadCourses();
  } catch (error) {
    console.error(error);
    alert(`No se pudo eliminar el curso: ${error.message}`);
  }
}

function getCourseFormData() {
  return {
    nombre: courseNameInput?.value.trim() ?? "",
    descripcion: courseDescriptionInput?.value.trim() ?? "",
    fechaInicio: courseStartDateInput?.value ?? "",
    cantidadHoras: Number(courseHoursInput?.value ?? 0),
    inscriptosMax: Number(courseCapacityInput?.value ?? 0),
    idCursoEstado: Number(courseStatusInput?.value ?? 1)
  };
}

function fillCourseForm(course) {
  const normalizedCourse = normalizeCourse(course);

  courseNameInput.value = normalizedCourse.nombre === "-" ? "" : normalizedCourse.nombre;
  courseDescriptionInput.value = normalizedCourse.descripcion;
  courseStartDateInput.value = formatDateForInput(normalizedCourse.fechaInicio);
  courseHoursInput.value = normalizedCourse.cantidadHoras;
  courseCapacityInput.value = normalizedCourse.inscriptosMax;
  courseStatusInput.value = String(normalizedCourse.estado.id || 1);
}

async function setupCourseForm() {
  if (!courseForm) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  editingCourseId = params.get("id");

  if (!editingCourseId) {
    return;
  }

  try {
    const course = await findCourseById(editingCourseId);

    if (Number(course.estado?.id) === 4) {
      alert("No se puede editar un curso eliminado.");
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
  } catch (error) {
    console.error(error);
    alert(`No se encontro el curso: ${error.message}`);
    window.location.href = "cursos.html";
  }
}

async function saveCourse(event) {
  event.preventDefault();

  const course = getCourseFormData();

  if (!course.nombre || !course.fechaInicio || course.cantidadHoras <= 0 || course.inscriptosMax <= 0) {
    alert("Complete los campos obligatorios del curso.");
    return;
  }

  const url = editingCourseId ? `/api/cursos/${editingCourseId}` : "/api/cursos";
  const method = editingCourseId ? "PUT" : "POST";

  try {
    const result = await requestApi(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(course)
    });

    alert(result.message);
    window.location.href = "cursos.html";
  } catch (error) {
    console.error(error);
    alert(`No se pudo guardar el curso: ${error.message}`);
  }
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

  loadCourses();
}

searchButton?.addEventListener("click", loadCourses);
clearButton?.addEventListener("click", clearFilters);
enrollmentFilter?.addEventListener("change", () => renderCourses(applyClientFilters(allCourses)));
nameFilter?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadCourses();
  }
});
coursesTableBody?.addEventListener("click", handleTableClick);
courseForm?.addEventListener("submit", saveCourse);

if (coursesTableBody) {
  loadCourses();
}

if (courseForm) {
  setupCourseForm();
}
