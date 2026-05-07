const coursesTableBody = document.querySelector("#coursesTableBody");
const courseForm = document.querySelector(".formulario form");
const courseIdInput = document.querySelector("#cursoId");
const nombreInput = document.querySelector("#nombre");
const inicioInput = document.querySelector("#inicio");
const horasInput = document.querySelector("#horas");
const maxInscriptosInput = document.querySelector("#maxinscripto");
const estadoInput = document.querySelector("#estado");
const formTitle = document.querySelector(".formulario h3");
const submitButton = courseForm?.querySelector('button[type="submit"]');
const cancelEditButton = document.querySelector("#cancelarEdicion");

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
    idCurso: course.idCurso ?? course.id_curso,
    nombre: course.nombre ?? "-",
    fechaInicio: course.fechaInicio ?? course.fecha_inicio,
    cantidadHoras: course.cantidadHoras ?? course.cantidad_horas ?? "-",
    inscriptosMax: course.inscriptosMax ?? course.inscriptos_max ?? "-",
    estado: course.estado ?? course.curso_estado_descripcion ?? "-",
    idCursoEstado: course.idCursoEstado ?? course.id_curso_estado ?? ""
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

function createActionsCell(courseId, courseStatusId) {
  const cell = document.createElement("td");
  const actions = document.createElement("div");
  actions.className = "table-actions";
  const isDeleted = Number(courseStatusId) === 4;

  const editButton = document.createElement("button");
  editButton.className = "action-button edit";
  editButton.type = "button";
  editButton.dataset.id = courseId;
  editButton.textContent = "Editar";
  editButton.disabled = isDeleted;
  editButton.title = isDeleted ? "No se puede editar un curso eliminado" : "";

  const deleteButton = document.createElement("button");
  deleteButton.className = "action-button delete";
  deleteButton.type = "button";
  deleteButton.dataset.id = courseId;
  deleteButton.textContent = "Eliminar";

  const diplomaButton = document.createElement("button");
  diplomaButton.className = "action-button diploma";
  diplomaButton.type = "button";
  diplomaButton.dataset.id = courseId;
  diplomaButton.textContent = "Diploma";

  actions.append(editButton, deleteButton, diplomaButton);
  cell.appendChild(actions);

  return cell;
}

function createCourseRow(course) {
  const normalizedCourse = normalizeCourse(course);
  const row = document.createElement("tr");
  row.dataset.id = normalizedCourse.idCurso;

  row.append(
    createCell(normalizedCourse.id),
    createCell(fixText(normalizedCourse.nombre)),
    createCell(formatDate(normalizedCourse.fechaInicio)),
    createCell(normalizedCourse.cantidadHoras),
    createCell(normalizedCourse.inscriptosMax),
    createStatusCell(normalizedCourse.estado),
    createActionsCell(normalizedCourse.idCurso, normalizedCourse.idCursoEstado)
  );

  return row;
}

async function requestApi(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `Error HTTP ${response.status}`);
  }

  if (!result?.ok) {
    throw new Error(result?.message || "La API respondio con error.");
  }

  return result;
}

function renderCourses(courses) {
  coursesTableBody.replaceChildren(...courses.map(createCourseRow));
}

async function loadCourses() {
  try {
    const result = await requestApi("/api/cursos");
    renderCourses(Array.isArray(result.data) ? result.data : []);
  } catch (error) {
    console.error(error);
    alert(`No se pudieron cargar los cursos: ${error.message}`);
    renderCourses([]);
  }
}

function getFormData() {
  return {
    nombre: nombreInput.value.trim(),
    descripcion: "",
    fecha_inicio: inicioInput.value,
    cantidad_horas: Number(horasInput.value),
    inscriptos_max: Number(maxInscriptosInput.value),
    id_curso_estado: Number(estadoInput.value)
  };
}

function formatDateForInput(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function resetForm() {
  courseForm.reset();
  courseIdInput.value = "";

  if (submitButton) {
    submitButton.textContent = "Agregar";
  }

  if (formTitle) {
    formTitle.textContent = "Agregar curso";
  }

  if (cancelEditButton) {
    cancelEditButton.hidden = true;
  }
}

function fillForm(course) {
  const normalizedCourse = normalizeCourse(course);

  courseIdInput.value = normalizedCourse.idCurso;
  nombreInput.value = fixText(normalizedCourse.nombre);
  inicioInput.value = formatDateForInput(normalizedCourse.fechaInicio);
  horasInput.value = normalizedCourse.cantidadHoras;
  maxInscriptosInput.value = normalizedCourse.inscriptosMax;
  estadoInput.value = String(normalizedCourse.idCursoEstado);

  if (submitButton) {
    submitButton.textContent = "Actualizar";
  }

  if (formTitle) {
    formTitle.textContent = "Actualizar curso";
  }

  if (cancelEditButton) {
    cancelEditButton.hidden = false;
  }
}

async function saveCourse(event) {
  event.preventDefault();

  const id = courseIdInput.value;
  const isEditing = Boolean(id);
  const url = isEditing ? `/api/cursos/${id}` : "/api/cursos";
  const method = isEditing ? "PUT" : "POST";

  try {
    const result = await requestApi(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(getFormData())
    });

    alert(result.message);
    resetForm();
    await loadCourses();
  } catch (error) {
    console.error(error);
    alert(`No se pudo guardar el curso: ${error.message}`);
  }
}

async function editCourse(id) {
  try {
    const result = await requestApi(`/api/cursos/${id}`);

    if (Number(result.data?.id_curso_estado) === 4) {
      alert("No se puede editar un curso eliminado");
      resetForm();
      return;
    }

    fillForm(result.data);
  } catch (error) {
    console.error(error);
    alert(`No se pudo cargar el curso: ${error.message}`);
  }
}

async function deleteCourse(id) {
  const confirmed = confirm("¿Seguro que querés eliminar este curso?");

  if (!confirmed) {
    return;
  }

  try {
    const result = await requestApi(`/api/cursos/${id}`, {
      method: "DELETE"
    });

    alert(result.message);
    await loadCourses();
  } catch (error) {
    console.error(error);
    alert(`No se pudo eliminar el curso: ${error.message}`);
  }
}

async function generateDiploma(id) {
  try {
    const result = await requestApi(`/api/cursos/${id}/diploma`);
    alert(result.message);
    console.log(result.data);
  } catch (error) {
    console.error(error);
    alert(`No se pudo generar el diploma: ${error.message}`);
  }
}

function handleTableClick(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const id = button.dataset.id;

  if (!id) {
    return;
  }

  if (button.classList.contains("edit")) {
    editCourse(id);
  } else if (button.classList.contains("delete")) {
    deleteCourse(id);
  } else if (button.classList.contains("diploma")) {
    generateDiploma(id);
  }
}

courseForm?.addEventListener("submit", saveCourse);
cancelEditButton?.addEventListener("click", resetForm);
coursesTableBody?.addEventListener("click", handleTableClick);

if (coursesTableBody) {
  loadCourses();
}
