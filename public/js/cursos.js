const coursesTableBody = document.querySelector("#coursesTableBody");
const nameFilter = document.querySelector("#courseNameFilter");
const statusFilter = document.querySelector("#courseStatusFilter");
const enrollmentFilter = document.querySelector("#courseEnrollmentFilter");
const searchButton = document.querySelector("#searchCourses");
const clearButton = document.querySelector("#clearCourses");
const resultsText = document.querySelector("#coursesResults");
const firstCoursePageButton = document.querySelector("#firstCoursesPage");
const previousCoursePageButton = document.querySelector("#previousCoursesPage");
const coursePageNumbersContainer = document.querySelector("#coursePageNumbers");
const nextCoursePageButton = document.querySelector("#nextCoursesPage");
const lastCoursePageButton = document.querySelector("#lastCoursesPage");
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
const COURSE_PAGE_SIZE = 10;
const coursePaginationState = {
  pagina: 1,
  limite: COURSE_PAGE_SIZE,
  total: 0,
  totalPaginas: 1,
};

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

function getFileNameFromContentDisposition(contentDisposition) {
  if (!contentDisposition) {
    return "certificado-curso.pdf";
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return fileNameMatch?.[1] || "certificado-curso.pdf";
}

async function requestPdfBlob(url) {
  const token = localStorage.getItem("token");
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (response.status === 401) {
    window.clearAuthSession?.();
    window.redirectToLogin?.();
    throw new Error("Sesion expirada.");
  }

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type") ?? "";

    if (contentType.includes("application/json")) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.message || `Error HTTP ${response.status}`);
    }

    const text = await response.text().catch(() => "");
    throw new Error(text || `Error HTTP ${response.status}`);
  }

  return {
    blob: await response.blob(),
    fileName: getFileNameFromContentDisposition(response.headers.get("Content-Disposition")),
  };
}

function openPdfBlob(blob, fileName) {
  const pdfUrl = URL.createObjectURL(blob);
  const newWindow = window.open(pdfUrl, "_blank", "noopener");

  if (!newWindow) {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
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
  const diplomaButton = createIconButton("diploma", "Diploma", "M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5L14 3.5ZM8 11v2h10v-2H8Zm0 4v2h7v-2H8ZM4 6v18h14v-2H6V6H4Z", course.id);
  const deleteButton = createIconButton("delete", "Eliminar curso", "M7 21a2 2 0 0 1-2-2V7h14v12a2 2 0 0 1-2 2H7ZM9 4h6l1 2h5v2H3V6h5l1-2Zm0 7v6h2v-6H9Zm4 0v6h2v-6h-2Z", course.id);

  if (Number(course.estado.id) === 4) {
    editButton.disabled = true;
    deleteButton.disabled = true;
  }

  actions.append(viewButton, editButton, diplomaButton, deleteButton);
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

function updateCoursePagination(total, page = coursePaginationState.pagina) {
  const totalCourses = Math.max(0, Number(total) || 0);
  const totalPages = Math.max(1, Math.ceil(totalCourses / coursePaginationState.limite));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);

  coursePaginationState.total = totalCourses;
  coursePaginationState.totalPaginas = totalPages;
  coursePaginationState.pagina = currentPage;

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  renderCoursePageNumbers();

  if (firstCoursePageButton) {
    firstCoursePageButton.disabled = isFirstPage;
  }

  if (previousCoursePageButton) {
    previousCoursePageButton.disabled = isFirstPage;
  }

  if (nextCoursePageButton) {
    nextCoursePageButton.disabled = isLastPage;
  }

  if (lastCoursePageButton) {
    lastCoursePageButton.disabled = isLastPage;
  }
}

function getVisibleCoursePageNumbers() {
  const totalPages = coursePaginationState.totalPaginas;
  const currentPage = coursePaginationState.pagina;
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function createCoursePageButton(pageNumber) {
  const button = document.createElement("button");
  const isActive = pageNumber === coursePaginationState.pagina;

  button.type = "button";
  button.textContent = pageNumber;
  button.dataset.page = pageNumber;
  button.setAttribute("aria-label", `Pagina ${pageNumber}`);

  if (isActive) {
    button.className = "active";
    button.setAttribute("aria-current", "page");
  }

  return button;
}

function renderCoursePageNumbers() {
  if (!coursePageNumbersContainer) {
    return;
  }

  const buttons = getVisibleCoursePageNumbers().map(createCoursePageButton);
  coursePageNumbersContainer.replaceChildren(...buttons);
}

function renderCourses(courses, page = coursePaginationState.pagina) {
  if (!coursesTableBody) {
    return;
  }

  updateCoursePagination(courses.length, page);

  const start = (coursePaginationState.pagina - 1) * coursePaginationState.limite;
  const end = start + coursePaginationState.limite;
  const visibleCourses = courses.slice(start, end);
  const rows = visibleCourses.map(createCourseRow);
  coursesTableBody.replaceChildren(...rows);

  if (resultsText) {
    const total = courses.length;
    const firstShown = total === 0 ? 0 : start + 1;
    const lastShown = total === 0 ? 0 : start + visibleCourses.length;

    resultsText.textContent = total === 0
      ? "Mostrando 0 resultados"
      : `Mostrando ${firstShown} a ${lastShown} de ${total} resultados`;
  }
}

function renderFilteredCourses(page = 1) {
  renderCourses(applyClientFilters(allCourses), page);
}

function goToCoursePage(page) {
  const targetPage = Math.min(
    Math.max(1, Number(page) || 1),
    coursePaginationState.totalPaginas
  );

  if (targetPage === coursePaginationState.pagina) {
    return;
  }

  renderFilteredCourses(targetPage);
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
    renderFilteredCourses(1);
  } catch (error) {
    console.error(error);
    allCourses = [];
    renderCourses([], 1);
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

async function showDiploma(id) {
  try {
    const { blob, fileName } = await requestPdfBlob(`/api/cursos/${id}/diploma`);
    openPdfBlob(blob, fileName);
  } catch (error) {
    console.error(error);
    alert(`No se pudo generar el diploma: ${error.message}`);
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
  } else if (button.classList.contains("diploma")) {
    showDiploma(button.dataset.id);
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
enrollmentFilter?.addEventListener("change", () => renderFilteredCourses(1));
firstCoursePageButton?.addEventListener("click", () => goToCoursePage(1));
previousCoursePageButton?.addEventListener("click", () => goToCoursePage(coursePaginationState.pagina - 1));
nextCoursePageButton?.addEventListener("click", () => goToCoursePage(coursePaginationState.pagina + 1));
lastCoursePageButton?.addEventListener("click", () => goToCoursePage(coursePaginationState.totalPaginas));
coursePageNumbersContainer?.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (button?.dataset.page) {
    goToCoursePage(button.dataset.page);
  }
});
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
