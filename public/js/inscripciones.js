const enrollmentsTableBody = document.querySelector("#enrollmentsTableBody");
const searchFilter = document.querySelector("#enrollmentSearchFilter");
const courseFilter = document.querySelector("#enrollmentCourseFilter");
const statusFilter = document.querySelector("#enrollmentStatusFilter");
const searchButton = document.querySelector("#searchEnrollments");
const clearButton = document.querySelector("#clearEnrollments");
const studentSearchSuggestions = document.querySelector("#studentSearchSuggestions");
const studentInput = document.querySelector("#enrollmentStudentInput");
const courseInput = document.querySelector("#enrollmentCourseInput");
const createButton = document.querySelector("#createEnrollment");
const resultsText = document.querySelector("#enrollmentsResults");
const firstPageButton = document.querySelector("#firstEnrollmentsPage");
const previousPageButton = document.querySelector("#previousEnrollmentsPage");
const pageNumbersContainer = document.querySelector("#enrollmentPageNumbers");
const nextPageButton = document.querySelector("#nextEnrollmentsPage");
const lastPageButton = document.querySelector("#lastEnrollmentsPage");
const enrollmentDetailsDialog = document.querySelector("#enrollmentDetailsDialog");
const modalEnrollmentId = document.querySelector("#modalEnrollmentId");
const modalEnrollmentStatus = document.querySelector("#modalEnrollmentStatus");
const modalEnrollmentStudent = document.querySelector("#modalEnrollmentStudent");
const modalEnrollmentDocument = document.querySelector("#modalEnrollmentDocument");
const modalEnrollmentCourse = document.querySelector("#modalEnrollmentCourse");
const modalEnrollmentDate = document.querySelector("#modalEnrollmentDate");
const cancelEnrollmentDialog = document.querySelector("#cancelEnrollmentDialog");
const cancelEnrollmentMessage = document.querySelector("#cancelEnrollmentMessage");
const confirmCancelEnrollmentButton = document.querySelector("#confirmCancelEnrollment");

let allEnrollments = [];
let availableStudents = [];
let selectedSearchStudentId = null;
let pendingCancelEnrollmentId = null;
const PAGE_SIZE = 10;
const paginationState = {
  pagina: 1,
  limite: PAGE_SIZE,
  total: 0,
  totalPaginas: 1,
};

function getToastContainer() {
  let container = document.querySelector("#adminToastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "adminToastContainer";
    container.className = "admin-toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");
    document.body.appendChild(container);
  }

  return container;
}

function showToast(message, type = "info") {
  const container = getToastContainer();
  const toast = document.createElement("div");
  const validTypes = ["success", "error", "info"];

  toast.className = `admin-toast ${validTypes.includes(type) ? type : "info"}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-hiding");
    window.setTimeout(() => toast.remove(), 220);
  }, 3600);
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

function getFileNameFromContentDisposition(contentDisposition) {
  if (!contentDisposition) {
    return "diploma-inscripcion.pdf";
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return fileNameMatch?.[1] || "diploma-inscripcion.pdf";
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
    throw new Error("Sesión expirada.");
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

function setLoading(message = "Cargando inscripciones...") {
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeEnrollment(enrollment) {
  return {
    id: enrollment.id,
    fechaHoraInscripcion: enrollment.fechaHoraInscripcion,
    estado: {
      id: enrollment.estado?.id,
      descripcion: enrollment.estado?.descripcion ?? "-",
      activo: enrollment.estado?.activo ?? false,
    },
    curso: {
      id: enrollment.curso?.id,
      nombre: enrollment.curso?.nombre ?? "-",
      estado: {
        id: Number(enrollment.curso?.estado?.id),
        descripcion: enrollment.curso?.estado?.descripcion ?? "-",
      },
    },
    estudiante: {
      id: enrollment.estudiante?.id,
      documento: enrollment.estudiante?.documento ?? "-",
      apellido: enrollment.estudiante?.apellido ?? "",
      nombres: enrollment.estudiante?.nombres ?? "",
      email: enrollment.estudiante?.email ?? "",
    },
  };
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getStudentFullName(student) {
  return `${student.apellido ?? ""}, ${student.nombres ?? ""}`.trim();
}

function getStudentSearchLabel(student) {
  const studentName = getStudentFullName(student);
  const document = student.documento ? ` - ${student.documento}` : "";
  return `${studentName}${document}`.trim();
}

function getEnrollmentStudentName(enrollment) {
  return `${enrollment.estudiante.apellido}, ${enrollment.estudiante.nombres}`.trim();
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function createStatusCell(enrollment) {
  const cell = document.createElement("td");
  const badge = document.createElement("span");
  const isCancelled = Number(enrollment.estado.id) === 2;

  badge.className = `course-state-badge ${isCancelled ? "inactive" : "active"}`;
  badge.textContent = enrollment.estado.descripcion;
  cell.appendChild(badge);
  return cell;
}

function createIconButton(className, label, iconPath, enrollmentId) {
  const button = document.createElement("button");
  button.className = `course-icon-button ${className}`;
  button.type = "button";
  button.dataset.id = enrollmentId;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPath}"/></svg>`;
  return button;
}

function createActionsCell(enrollment) {
  const cell = document.createElement("td");
  const actions = document.createElement("div");
  actions.className = "course-actions";

  const viewButton = createIconButton("view", "Ver inscripción", "M12 5c5 0 9 5.5 9 7s-4 7-9 7-9-5.5-9-7 4-7 9-7Zm0 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z", enrollment.id);
  const diplomaButton = createIconButton("diploma", "Diploma", "M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5L14 3.5ZM8 11v2h10v-2H8Zm0 4v2h7v-2H8ZM4 6v18h14v-2H6V6H4Z", enrollment.id);
  const cancelButton = createIconButton("delete", "Cancelar inscripción", "M7 21a2 2 0 0 1-2-2V7h14v12a2 2 0 0 1-2 2H7ZM9 4h6l1 2h5v2H3V6h5l1-2Zm0 7v6h2v-6H9Zm4 0v6h2v-6h-2Z", enrollment.id);
  const isCancelled = Number(enrollment.estado.id) === 2;
  const courseIsClosed = Number(enrollment.curso.estado.id) === 3;

  if (isCancelled) {
    diplomaButton.disabled = true;
    diplomaButton.title = "No se genera diploma para inscripciones canceladas";
    cancelButton.disabled = true;
  } else if (!courseIsClosed) {
    diplomaButton.disabled = true;
    diplomaButton.title = "El diploma se genera cuando la inscripción del curso está cerrada";
  }

  actions.append(viewButton, diplomaButton, cancelButton);
  cell.appendChild(actions);
  return cell;
}

function createEnrollmentRow(enrollment) {
  const normalizedEnrollment = normalizeEnrollment(enrollment);
  const row = document.createElement("tr");
  const studentName = `${normalizedEnrollment.estudiante.apellido}, ${normalizedEnrollment.estudiante.nombres}`.trim();

  row.dataset.id = normalizedEnrollment.id;
  row.append(
    createCell(normalizedEnrollment.id),
    createCell(studentName || "-"),
    createCell(normalizedEnrollment.estudiante.documento),
    createCell(normalizedEnrollment.curso.nombre),
    createCell(formatDate(normalizedEnrollment.fechaHoraInscripcion)),
    createStatusCell(normalizedEnrollment),
    createActionsCell(normalizedEnrollment)
  );

  return row;
}

function normalizePaginationMeta(meta = {}) {
  const limite = Math.max(1, Number(meta.limite ?? PAGE_SIZE) || PAGE_SIZE);
  const total = Math.max(0, Number(meta.total ?? 0) || 0);
  const totalPaginas = Math.max(1, Number(meta.totalPaginas ?? Math.ceil(total / limite)) || 1);
  const pagina = Math.min(
    Math.max(1, Number(meta.pagina ?? paginationState.pagina) || 1),
    totalPaginas
  );

  return {
    pagina,
    limite,
    total,
    totalPaginas,
  };
}

function getVisiblePageNumbers() {
  const totalPages = paginationState.totalPaginas;
  const currentPage = paginationState.pagina;
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

function createPageNumberButton(pageNumber) {
  const button = document.createElement("button");
  const isActive = pageNumber === paginationState.pagina;

  button.type = "button";
  button.textContent = pageNumber;
  button.dataset.page = pageNumber;
  button.setAttribute("aria-label", `Página ${pageNumber}`);

  if (isActive) {
    button.className = "active";
    button.setAttribute("aria-current", "page");
  }

  return button;
}

function renderPageNumbers() {
  if (!pageNumbersContainer) {
    return;
  }

  const buttons = getVisiblePageNumbers().map(createPageNumberButton);
  pageNumbersContainer.replaceChildren(...buttons);
}

function updatePagination(meta = {}) {
  const normalizedMeta = normalizePaginationMeta(meta);

  paginationState.pagina = normalizedMeta.pagina;
  paginationState.limite = normalizedMeta.limite;
  paginationState.total = normalizedMeta.total;
  paginationState.totalPaginas = normalizedMeta.totalPaginas;

  const isFirstPage = paginationState.pagina <= 1;
  const isLastPage = paginationState.pagina >= paginationState.totalPaginas;

  renderPageNumbers();

  if (firstPageButton) {
    firstPageButton.disabled = isFirstPage;
  }

  if (previousPageButton) {
    previousPageButton.disabled = isFirstPage;
  }

  if (nextPageButton) {
    nextPageButton.disabled = isLastPage;
  }

  if (lastPageButton) {
    lastPageButton.disabled = isLastPage;
  }
}

function renderEnrollments(enrollments, meta = null) {
  if (!enrollmentsTableBody) {
    return;
  }

  updatePagination(meta ?? {});
  allEnrollments = enrollments.map(normalizeEnrollment);
  enrollmentsTableBody.replaceChildren(...enrollments.map(createEnrollmentRow));

  if (resultsText) {
    const total = paginationState.total;
    const shown = enrollments.length;
    const firstShown = total === 0 ? 0 : ((paginationState.pagina - 1) * paginationState.limite) + 1;
    const lastShown = total === 0 ? 0 : firstShown + shown - 1;

    resultsText.textContent = total === 0
      ? "Mostrando 0 resultados"
      : `Mostrando ${firstShown} a ${lastShown} de ${total} resultados`;
  }
}

function buildEnrollmentQuery() {
  const params = new URLSearchParams();
  const search = searchFilter?.value.trim();
  const course = courseFilter?.value;
  const status = statusFilter?.value;

  if (selectedSearchStudentId) {
    params.set("idEstudiante", selectedSearchStudentId);
  } else if (search) {
    params.set("busqueda", search);
  }

  if (course) {
    params.set("idCurso", course);
  }

  if (status) {
    params.set("estado", status);
  }

  params.set("pagina", paginationState.pagina);
  params.set("limite", paginationState.limite);

  const query = params.toString();
  return query ? `?${query}` : "";
}

function hideStudentSuggestions() {
  if (!studentSearchSuggestions) {
    return;
  }

  studentSearchSuggestions.hidden = true;
  studentSearchSuggestions.replaceChildren();
  searchFilter?.setAttribute("aria-expanded", "false");
}

function createStudentSuggestion(student) {
  const option = document.createElement("button");
  const name = document.createElement("strong");
  const meta = document.createElement("small");

  option.className = "admin-autocomplete-option";
  option.type = "button";
  option.setAttribute("role", "option");
  option.dataset.id = student.id;

  name.textContent = getStudentFullName(student);
  meta.textContent = student.documento ? `Documento ${student.documento}` : "Sin documento";
  option.append(name, meta);

  return option;
}

function renderStudentSuggestions() {
  if (!studentSearchSuggestions || !searchFilter) {
    return;
  }

  const search = searchFilter.value.trim();

  if (!search) {
    hideStudentSuggestions();
    return;
  }

  const normalizedSearch = normalizeText(search);
  const matches = availableStudents
    .filter((student) => normalizeText(getStudentSearchLabel(student)).includes(normalizedSearch))
    .slice(0, 6);

  if (matches.length === 0) {
    hideStudentSuggestions();
    return;
  }

  studentSearchSuggestions.replaceChildren(...matches.map(createStudentSuggestion));
  studentSearchSuggestions.hidden = false;
  searchFilter.setAttribute("aria-expanded", "true");
}

function selectSearchStudent(studentId) {
  const student = availableStudents.find((item) => String(item.id) === String(studentId));

  if (!student || !searchFilter) {
    return;
  }

  selectedSearchStudentId = student.id;
  searchFilter.value = getStudentSearchLabel(student);
  hideStudentSuggestions();
}

function fillSelect(select, items, placeholder, getValue, getLabel) {
  if (!select) {
    return;
  }

  const options = [
    new Option(placeholder, ""),
    ...items.map((item) => new Option(getLabel(item), getValue(item))),
  ];

  select.replaceChildren(...options);
}

async function loadOptions() {
  const result = await requestApi("/api/inscripciones/opciones");
  const cursos = result.data?.cursos ?? [];
  const estudiantes = result.data?.estudiantes ?? [];

  availableStudents = estudiantes;

  fillSelect(
    courseFilter,
    cursos,
    "Todos",
    (course) => course.id,
    (course) => course.nombre
  );
  fillSelect(
    courseInput,
    cursos,
    cursos.length ? "Seleccione un curso" : "No hay cursos con inscripción abierta",
    (course) => course.id,
    (course) => `${course.nombre} (${course.inscriptosConfirmados}/${course.inscriptosMax})`
  );
  fillSelect(
    studentInput,
    estudiantes,
    estudiantes.length ? "Seleccione un estudiante" : "No hay estudiantes activos",
    (student) => student.id,
    (student) => `${student.apellido}, ${student.nombres} - ${student.documento}`
  );
}

async function loadEnrollments(page = paginationState.pagina) {
  paginationState.pagina = Math.max(1, Number(page) || 1);
  setLoading();

  try {
    const result = await requestApi(`/api/inscripciones${buildEnrollmentQuery()}`);
    const meta = normalizePaginationMeta(result.meta ?? {});

    if (meta.total > 0 && paginationState.pagina > meta.totalPaginas) {
      return loadEnrollments(meta.totalPaginas);
    }

    renderEnrollments(Array.isArray(result.data) ? result.data : [], result.meta);
  } catch (error) {
    console.error(error);
    renderEnrollments([]);
    showToast(`No se pudieron cargar las inscripciones: ${error.message}`, "error");
  }
}

async function createEnrollment() {
  const idCurso = courseInput?.value;
  const idEstudiante = studentInput?.value;

  if (!idCurso || !idEstudiante) {
    showToast("Seleccione un curso y un estudiante.", "info");
    return;
  }

  try {
    const result = await requestApi("/api/inscripciones", {
      method: "POST",
      body: JSON.stringify({
        idCurso: Number(idCurso),
        idEstudiante: Number(idEstudiante),
      }),
    });

    showToast(result.message, "success");
    courseInput.value = "";
    studentInput.value = "";
    await loadOptions();
    await loadEnrollments(1);
  } catch (error) {
    console.error(error);
    showToast(`No se pudo crear la inscripción: ${error.message}`, "error");
  }
}

function findEnrollmentById(id) {
  return allEnrollments.find((enrollment) => String(enrollment.id) === String(id));
}

function closeEnrollmentModal() {
  if (enrollmentDetailsDialog?.open) {
    enrollmentDetailsDialog.close();
  }
}

function openEnrollmentModal(enrollment) {
  const studentName = getEnrollmentStudentName(enrollment);
  const isCancelled = Number(enrollment.estado.id) === 2;

  if (modalEnrollmentId) {
    modalEnrollmentId.textContent = enrollment.id;
  }

  if (modalEnrollmentStatus) {
    modalEnrollmentStatus.className = `course-state-badge ${isCancelled ? "inactive" : "active"}`;
    modalEnrollmentStatus.textContent = enrollment.estado.descripcion;
  }

  if (modalEnrollmentStudent) {
    modalEnrollmentStudent.textContent = studentName || "-";
  }

  if (modalEnrollmentDocument) {
    modalEnrollmentDocument.textContent = enrollment.estudiante.documento;
  }

  if (modalEnrollmentCourse) {
    modalEnrollmentCourse.textContent = enrollment.curso.nombre;
  }

  if (modalEnrollmentDate) {
    modalEnrollmentDate.textContent = formatDate(enrollment.fechaHoraInscripcion);
  }

  if (enrollmentDetailsDialog?.showModal) {
    enrollmentDetailsDialog.showModal();
  }
}

function showEnrollment(id) {
  const enrollment = findEnrollmentById(id);

  if (!enrollment) {
    console.warn("No se encontró la inscripción seleccionada.");
    return;
  }

  openEnrollmentModal(enrollment);
}

function closeCancelEnrollmentModal() {
  pendingCancelEnrollmentId = null;

  if (cancelEnrollmentDialog?.open) {
    cancelEnrollmentDialog.close();
  }
}

function openCancelEnrollmentModal(id) {
  const enrollment = findEnrollmentById(id);
  const studentName = enrollment ? getEnrollmentStudentName(enrollment) : "esta inscripción";

  pendingCancelEnrollmentId = id;

  if (cancelEnrollmentMessage) {
    cancelEnrollmentMessage.textContent = `Vas a cancelar la inscripción de ${studentName}. Esta acción cambia el estado a cancelada.`;
  }

  if (cancelEnrollmentDialog?.showModal) {
    cancelEnrollmentDialog.showModal();
  }
}

async function cancelEnrollment(id) {
  openCancelEnrollmentModal(id);
}

async function confirmCancelEnrollment() {
  if (!pendingCancelEnrollmentId) {
    return;
  }

  const id = pendingCancelEnrollmentId;

  try {
    const result = await requestApi(`/api/inscripciones/${id}`, { method: "DELETE" });
    closeCancelEnrollmentModal();
    showToast(result.message, "success");
    await loadOptions();
    await loadEnrollments();
  } catch (error) {
    console.error(error);
    showToast(`No se pudo cancelar la inscripción: ${error.message}`, "error");
  }
}

async function showDiploma(id) {
  try {
    showToast("Generando diploma...", "info");
    const { blob, fileName } = await requestPdfBlob(`/api/inscripciones/${id}/diploma`);
    openPdfBlob(blob, fileName);
    showToast("Diploma generado correctamente.", "success");
  } catch (error) {
    console.error(error);
    showToast(`No se pudo generar el diploma: ${error.message}`, "error");
  }
}

function handleTableClick(event) {
  const button = event.target.closest("button");

  if (!button?.dataset.id) {
    return;
  }

  if (button.classList.contains("view")) {
    showEnrollment(button.dataset.id);
  } else if (button.classList.contains("delete")) {
    cancelEnrollment(button.dataset.id);
  } else if (button.classList.contains("diploma")) {
    showDiploma(button.dataset.id);
  }
}

function clearFilters() {
  if (searchFilter) {
    searchFilter.value = "";
  }

  selectedSearchStudentId = null;
  hideStudentSuggestions();

  if (courseFilter) {
    courseFilter.value = "";
  }

  if (statusFilter) {
    statusFilter.value = "";
  }

  loadEnrollments(1);
}

function goToPage(page) {
  const targetPage = Math.min(
    Math.max(1, Number(page) || 1),
    paginationState.totalPaginas
  );

  if (targetPage === paginationState.pagina) {
    return;
  }

  loadEnrollments(targetPage);
}

async function setupEnrollmentsPage() {
  if (!enrollmentsTableBody) {
    return;
  }

  try {
    await loadOptions();
    await loadEnrollments();
  } catch (error) {
    console.error(error);
    showToast(`No se pudo inicializar la pantalla de inscripciones: ${error.message}`, "error");
  }
}

searchButton?.addEventListener("click", () => loadEnrollments(1));
clearButton?.addEventListener("click", clearFilters);
createButton?.addEventListener("click", createEnrollment);
enrollmentsTableBody?.addEventListener("click", handleTableClick);
firstPageButton?.addEventListener("click", () => goToPage(1));
previousPageButton?.addEventListener("click", () => goToPage(paginationState.pagina - 1));
nextPageButton?.addEventListener("click", () => goToPage(paginationState.pagina + 1));
lastPageButton?.addEventListener("click", () => goToPage(paginationState.totalPaginas));
pageNumbersContainer?.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (button?.dataset.page) {
    goToPage(button.dataset.page);
  }
});
studentSearchSuggestions?.addEventListener("click", (event) => {
  const option = event.target.closest(".admin-autocomplete-option");

  if (option?.dataset.id) {
    selectSearchStudent(option.dataset.id);
  }
});
searchFilter?.addEventListener("input", () => {
  selectedSearchStudentId = null;
  renderStudentSuggestions();
});
searchFilter?.addEventListener("focus", renderStudentSuggestions);
searchFilter?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideStudentSuggestions();
    return;
  }

  if (event.key === "Enter") {
    hideStudentSuggestions();
    loadEnrollments(1);
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".admin-autocomplete")) {
    hideStudentSuggestions();
  }
});
enrollmentDetailsDialog?.addEventListener("click", (event) => {
  if (event.target === enrollmentDetailsDialog) {
    closeEnrollmentModal();
  }
});
document.querySelectorAll("[data-close-enrollment-modal]").forEach((button) => {
  button.addEventListener("click", closeEnrollmentModal);
});
cancelEnrollmentDialog?.addEventListener("click", (event) => {
  if (event.target === cancelEnrollmentDialog) {
    closeCancelEnrollmentModal();
  }
});
document.querySelectorAll("[data-close-cancel-modal]").forEach((button) => {
  button.addEventListener("click", closeCancelEnrollmentModal);
});
confirmCancelEnrollmentButton?.addEventListener("click", confirmCancelEnrollment);

setupEnrollmentsPage();
