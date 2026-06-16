const studentsTableBody = document.querySelector("#studentsTableBody");
const searchFilter = document.querySelector("#studentSearchFilter");
const documentFilter = document.querySelector("#studentDocumentFilter");
const statusFilter = document.querySelector("#studentStatusFilter");
const searchButton = document.querySelector("#searchStudents");
const clearButton = document.querySelector("#clearStudents");
const newStudentButton = document.querySelector("#newStudentButton");
const studentFormPanel = document.querySelector("#studentFormPanel");
const studentForm = document.querySelector("#studentForm");
const studentFormTitle = document.querySelector("#studentFormTitle");
const studentFormIntro = document.querySelector("#studentFormIntro");
const cancelStudentFormButton = document.querySelector("#cancelStudentForm");
const saveStudentButton = document.querySelector("#saveStudentButton");
const studentDocumentInput = document.querySelector("#studentDocument");
const studentEmailInput = document.querySelector("#studentEmail");
const studentLastNameInput = document.querySelector("#studentLastName");
const studentNamesInput = document.querySelector("#studentNames");
const studentBirthDateInput = document.querySelector("#studentBirthDate");
const studentActiveInput = document.querySelector("#studentActive");
const resultsText = document.querySelector("#studentsResults");
const firstPageButton = document.querySelector("#firstStudentsPage");
const previousPageButton = document.querySelector("#previousStudentsPage");
const pageNumbersContainer = document.querySelector("#studentPageNumbers");
const nextPageButton = document.querySelector("#nextStudentsPage");
const lastPageButton = document.querySelector("#lastStudentsPage");
const studentDetailsDialog = document.querySelector("#studentDetailsDialog");
const modalStudentId = document.querySelector("#modalStudentId");
const modalStudentStatus = document.querySelector("#modalStudentStatus");
const modalStudentLastName = document.querySelector("#modalStudentLastName");
const modalStudentNames = document.querySelector("#modalStudentNames");
const modalStudentDocument = document.querySelector("#modalStudentDocument");
const modalStudentEmail = document.querySelector("#modalStudentEmail");
const modalStudentBirthDate = document.querySelector("#modalStudentBirthDate");
const modalStudentEnrollments = document.querySelector("#modalStudentEnrollments");
const deleteStudentDialog = document.querySelector("#deleteStudentDialog");
const deleteStudentMessage = document.querySelector("#deleteStudentMessage");
const confirmDeleteStudentButton = document.querySelector("#confirmDeleteStudent");

let allStudents = [];
let editingStudentId = null;
let pendingDeleteStudentId = null;
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

function setLoading(message = "Cargando estudiantes...") {
  if (resultsText) {
    resultsText.textContent = message;
  }
}

function setText(element, text) {
  if (element) {
    element.textContent = text;
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
    timeZone: "UTC",
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

function normalizeStudent(student) {
  return {
    id: student.id,
    documento: student.documento ?? "-",
    apellido: student.apellido ?? "",
    nombres: student.nombres ?? "",
    email: student.email ?? "-",
    fechaNacimiento: student.fechaNacimiento,
    activo: Boolean(student.activo),
    inscripcionesConfirmadas: Number(student.inscripcionesConfirmadas ?? 0),
  };
}

function getStudentFullName(student) {
  return `${student.apellido ?? ""}, ${student.nombres ?? ""}`.trim();
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function createStatusCell(student) {
  const cell = document.createElement("td");
  const badge = document.createElement("span");

  badge.className = `course-state-badge ${student.activo ? "active" : "inactive"}`;
  badge.textContent = student.activo ? "Activo" : "Inactivo";
  cell.appendChild(badge);
  return cell;
}

function createIconButton(className, label, iconPath, studentId) {
  const button = document.createElement("button");
  button.className = `course-icon-button ${className}`;
  button.type = "button";
  button.dataset.id = studentId;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPath}"/></svg>`;
  return button;
}

function createActionsCell(student) {
  const cell = document.createElement("td");
  const actions = document.createElement("div");
  actions.className = "course-actions";

  const viewButton = createIconButton("view", "Ver estudiante", "M12 5c5 0 9 5.5 9 7s-4 7-9 7-9-5.5-9-7 4-7 9-7Zm0 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z", student.id);
  const editButton = createIconButton("edit", "Editar estudiante", "M4 17.2V21h3.8L18.9 9.9l-3.8-3.8L4 17.2ZM20.7 8.1a1 1 0 0 0 0-1.4l-3.4-3.4a1 1 0 0 0-1.4 0l-1.4 1.4 4.8 4.8 1.4-1.4Z", student.id);
  const deleteButton = createIconButton("delete", "Dar de baja estudiante", "M7 21a2 2 0 0 1-2-2V7h14v12a2 2 0 0 1-2 2H7ZM9 4h6l1 2h5v2H3V6h5l1-2Zm0 7v6h2v-6H9Zm4 0v6h2v-6h-2Z", student.id);

  if (!student.activo) {
    deleteButton.disabled = true;
    deleteButton.title = "El estudiante ya está inactivo";
  }

  actions.append(viewButton, editButton, deleteButton);
  cell.appendChild(actions);
  return cell;
}

function createStudentRow(student) {
  const normalizedStudent = normalizeStudent(student);
  const row = document.createElement("tr");

  row.dataset.id = normalizedStudent.id;
  row.append(
    createCell(normalizedStudent.id),
    createCell(getStudentFullName(normalizedStudent) || "-"),
    createCell(normalizedStudent.documento),
    createCell(normalizedStudent.email),
    createCell(formatDate(normalizedStudent.fechaNacimiento)),
    createCell(normalizedStudent.inscripcionesConfirmadas),
    createStatusCell(normalizedStudent),
    createActionsCell(normalizedStudent)
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

  pageNumbersContainer.replaceChildren(...getVisiblePageNumbers().map(createPageNumberButton));
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

function renderStudents(students, meta = null) {
  if (!studentsTableBody) {
    return;
  }

  updatePagination(meta ?? {});
  allStudents = students.map(normalizeStudent);

  if (!students.length) {
    const row = document.createElement("tr");
    const cell = createCell("No hay estudiantes para mostrar.");

    cell.colSpan = 8;
    row.appendChild(cell);
    studentsTableBody.replaceChildren(row);
  } else {
    studentsTableBody.replaceChildren(...students.map(createStudentRow));
  }

  if (resultsText) {
    const total = paginationState.total;
    const shown = students.length;
    const firstShown = total === 0 ? 0 : ((paginationState.pagina - 1) * paginationState.limite) + 1;
    const lastShown = total === 0 ? 0 : firstShown + shown - 1;

    resultsText.textContent = total === 0
      ? "Mostrando 0 resultados"
      : `Mostrando ${firstShown} a ${lastShown} de ${total} resultados`;
  }
}

function buildStudentQuery() {
  const params = new URLSearchParams();
  const search = searchFilter?.value.trim();
  const documentValue = documentFilter?.value.trim();
  const status = statusFilter?.value;

  if (search) {
    params.set("busqueda", search);
  }

  if (documentValue) {
    params.set("documento", documentValue);
  }

  if (status !== undefined && status !== null && status !== "") {
    params.set("activo", status);
  }

  params.set("pagina", paginationState.pagina);
  params.set("limite", paginationState.limite);

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function loadStudents(page = paginationState.pagina) {
  paginationState.pagina = Math.max(1, Number(page) || 1);
  setLoading();

  try {
    const result = await requestApi(`/api/estudiantes${buildStudentQuery()}`);
    const meta = normalizePaginationMeta(result.meta ?? {});

    if (meta.total > 0 && paginationState.pagina > meta.totalPaginas) {
      return loadStudents(meta.totalPaginas);
    }

    renderStudents(Array.isArray(result.data) ? result.data : [], result.meta);
  } catch (error) {
    console.error(error);
    renderStudents([]);
    showToast(`No se pudieron cargar los estudiantes: ${error.message}`, "error");
  }
}

function resetStudentForm() {
  editingStudentId = null;
  studentForm?.reset();

  if (studentActiveInput) {
    studentActiveInput.value = "1";
  }

  setText(studentFormTitle, "Nuevo Estudiante");
  setText(studentFormIntro, "Complete los datos del estudiante");
}

function openStudentForm(student = null) {
  if (!studentFormPanel) {
    return;
  }

  resetStudentForm();

  if (student) {
    const normalizedStudent = normalizeStudent(student);

    editingStudentId = normalizedStudent.id;
    setText(studentFormTitle, "Editar Estudiante");
    setText(studentFormIntro, `Actualice los datos de ${getStudentFullName(normalizedStudent)}`);

    studentDocumentInput.value = normalizedStudent.documento === "-" ? "" : normalizedStudent.documento;
    studentEmailInput.value = normalizedStudent.email === "-" ? "" : normalizedStudent.email;
    studentLastNameInput.value = normalizedStudent.apellido;
    studentNamesInput.value = normalizedStudent.nombres;
    studentBirthDateInput.value = formatDateForInput(normalizedStudent.fechaNacimiento);
    studentActiveInput.value = normalizedStudent.activo ? "1" : "0";
  }

  studentFormPanel.hidden = false;
  studentDocumentInput?.focus();
}

function closeStudentForm() {
  if (studentFormPanel) {
    studentFormPanel.hidden = true;
  }

  resetStudentForm();
}

function getStudentFormData() {
  return {
    documento: studentDocumentInput?.value.trim() ?? "",
    email: studentEmailInput?.value.trim() ?? "",
    apellido: studentLastNameInput?.value.trim() ?? "",
    nombres: studentNamesInput?.value.trim() ?? "",
    fechaNacimiento: studentBirthDateInput?.value ?? "",
    activo: Number(studentActiveInput?.value ?? 1),
  };
}

async function saveStudent(event) {
  event.preventDefault();

  const student = getStudentFormData();
  const wasEditing = Boolean(editingStudentId);
  const targetPage = wasEditing ? paginationState.pagina : 1;

  if (!student.documento || !student.email || !student.apellido || !student.nombres || !student.fechaNacimiento) {
    showToast("Complete los campos obligatorios del estudiante.", "info");
    return;
  }

  const url = editingStudentId ? `/api/estudiantes/${editingStudentId}` : "/api/estudiantes";
  const method = editingStudentId ? "PUT" : "POST";

  if (saveStudentButton) {
    saveStudentButton.disabled = true;
  }

  try {
    const result = await requestApi(url, {
      method,
      body: JSON.stringify(student),
    });

    showToast(result.message, "success");
    closeStudentForm();
    await loadStudents(targetPage);
  } catch (error) {
    console.error(error);
    showToast(`No se pudo guardar el estudiante: ${error.message}`, "error");
  } finally {
    if (saveStudentButton) {
      saveStudentButton.disabled = false;
    }
  }
}

function findStudentById(id) {
  return allStudents.find((student) => String(student.id) === String(id));
}

function closeStudentModal() {
  if (studentDetailsDialog?.open) {
    studentDetailsDialog.close();
  }
}

function openStudentModal(student) {
  const normalizedStudent = normalizeStudent(student);

  setText(modalStudentId, normalizedStudent.id);
  setText(modalStudentLastName, normalizedStudent.apellido || "-");
  setText(modalStudentNames, normalizedStudent.nombres || "-");
  setText(modalStudentDocument, normalizedStudent.documento);
  setText(modalStudentEmail, normalizedStudent.email);
  setText(modalStudentBirthDate, formatDate(normalizedStudent.fechaNacimiento));
  setText(modalStudentEnrollments, normalizedStudent.inscripcionesConfirmadas);

  if (modalStudentStatus) {
    modalStudentStatus.className = `course-state-badge ${normalizedStudent.activo ? "active" : "inactive"}`;
    modalStudentStatus.textContent = normalizedStudent.activo ? "Activo" : "Inactivo";
  }

  if (studentDetailsDialog?.showModal) {
    studentDetailsDialog.showModal();
  }
}

function showStudent(id) {
  const student = findStudentById(id);

  if (!student) {
    showToast("No se encontró el estudiante seleccionado.", "error");
    return;
  }

  openStudentModal(student);
}

async function editStudent(id) {
  let student = findStudentById(id);

  try {
    if (!student) {
      const result = await requestApi(`/api/estudiantes/${id}`);
      student = result.data;
    }

    openStudentForm(student);
  } catch (error) {
    console.error(error);
    showToast(`No se pudo cargar el estudiante: ${error.message}`, "error");
  }
}

function closeDeleteStudentModal() {
  pendingDeleteStudentId = null;

  if (deleteStudentDialog?.open) {
    deleteStudentDialog.close();
  }
}

function openDeleteStudentModal(id) {
  const student = findStudentById(id);
  const studentName = student ? getStudentFullName(student) : "este estudiante";

  pendingDeleteStudentId = id;

  if (deleteStudentMessage) {
    deleteStudentMessage.textContent = `Vas a dar de baja a ${studentName}. El estudiante quedará inactivo para nuevas inscripciones.`;
  }

  if (deleteStudentDialog?.showModal) {
    deleteStudentDialog.showModal();
  }
}

async function confirmDeleteStudent() {
  if (!pendingDeleteStudentId) {
    return;
  }

  const id = pendingDeleteStudentId;

  try {
    const result = await requestApi(`/api/estudiantes/${id}`, { method: "DELETE" });
    closeDeleteStudentModal();
    showToast(result.message, "success");
    await loadStudents();
  } catch (error) {
    console.error(error);
    showToast(`No se pudo dar de baja el estudiante: ${error.message}`, "error");
  }
}

function handleTableClick(event) {
  const button = event.target.closest("button");

  if (!button?.dataset.id) {
    return;
  }

  if (button.classList.contains("view")) {
    showStudent(button.dataset.id);
  } else if (button.classList.contains("edit")) {
    editStudent(button.dataset.id);
  } else if (button.classList.contains("delete")) {
    openDeleteStudentModal(button.dataset.id);
  }
}

function clearFilters() {
  if (searchFilter) {
    searchFilter.value = "";
  }

  if (documentFilter) {
    documentFilter.value = "";
  }

  if (statusFilter) {
    statusFilter.value = "";
  }

  loadStudents(1);
}

function goToPage(page) {
  const targetPage = Math.min(
    Math.max(1, Number(page) || 1),
    paginationState.totalPaginas
  );

  if (targetPage === paginationState.pagina) {
    return;
  }

  loadStudents(targetPage);
}

searchButton?.addEventListener("click", () => loadStudents(1));
clearButton?.addEventListener("click", clearFilters);
newStudentButton?.addEventListener("click", () => openStudentForm());
cancelStudentFormButton?.addEventListener("click", closeStudentForm);
studentForm?.addEventListener("submit", saveStudent);
studentsTableBody?.addEventListener("click", handleTableClick);
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
searchFilter?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadStudents(1);
  }
});
documentFilter?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadStudents(1);
  }
});
studentDetailsDialog?.addEventListener("click", (event) => {
  if (event.target === studentDetailsDialog) {
    closeStudentModal();
  }
});
document.querySelectorAll("[data-close-student-modal]").forEach((button) => {
  button.addEventListener("click", closeStudentModal);
});
deleteStudentDialog?.addEventListener("click", (event) => {
  if (event.target === deleteStudentDialog) {
    closeDeleteStudentModal();
  }
});
document.querySelectorAll("[data-close-delete-student-modal]").forEach((button) => {
  button.addEventListener("click", closeDeleteStudentModal);
});
confirmDeleteStudentButton?.addEventListener("click", confirmDeleteStudent);

if (studentsTableBody) {
  loadStudents();
}
