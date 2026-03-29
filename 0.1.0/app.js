let items = JSON.parse(localStorage.getItem("items")) || [];

items.forEach(item => {
  item.createdAt = new Date(item.createdAt);
});

let nextId =
  items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;

let editId = null;

function saveToLocalStorage() {
  localStorage.setItem("items", JSON.stringify(items));
}

// поля і не поля і 2 фільтри знизу
const form = document.getElementById("createForm");
const resetBtn = document.getElementById("resetBtn");
const tableBody = document.getElementById("tableBody");
const nameInput = document.getElementById("nameInput");
const teacherInput = document.getElementById("teacherInput");
const courseSelect = document.getElementById("courseSelect");
const prioritySelect = document.getElementById("prioritySelect");
const noteInput = document.getElementById("noteInput");
const sortDate = document.getElementById("sortDate");
const filterPriority = document.getElementById("filterPriority");

// помилки
const errors = {
  name: document.getElementById("nameError"),
  teacher: document.getElementById("teacherError"),
  course: document.getElementById("courseError"),
  priority: document.getElementById("priorityError"),
  note: document.getElementById("noteError")
};

function readForm() {
  return {
    name: nameInput.value.trim(),
    teacher: teacherInput.value.trim(),
    course: courseSelect.value,
    priority: prioritySelect.value,
    note: noteInput.value.trim()
  };
}

function validate(data) {
  let valid = true;
  clearErrors();

  if (!data.name) {
    showError(nameInput, errors.name, "Обовʼязкове поле");
    valid = false;
  }

  if (!data.teacher) {
    showError(teacherInput, errors.teacher, "Обовʼязкове поле");
    valid = false;
  }

  if (!data.course) {
    showError(courseSelect, errors.course, "Оберіть курс");
    valid = false;
  }

  if (!data.priority) {
    showError(prioritySelect, errors.priority, "Оберіть пріоритет");
    valid = false;
  }

  if (!data.note) {
    showError(noteInput, errors.note, "Додайте запис");
    valid = false;
  }

  return valid;
}

// помилкаа
function showError(input, errorElem, message) {
  input.classList.add("invalid");
  errorElem.textContent = message;
}

// очищення помилки
function clearErrors() {
  document.querySelectorAll(".invalid").forEach(el =>
    el.classList.remove("invalid")
  );

  Object.values(errors).forEach(e => (e.textContent = ""));
}

// Записи
function saveItem(data) {
  if (editId === null) {
    // створити
    items.push({
      id: nextId++,
      ...data,
      createdAt: new Date()
    });
  } else {
    // оновити
    const item = items.find(i => i.id === editId);
    Object.assign(item, data);
    editId = null;
  }

  saveToLocalStorage();
}
    // видалити
function deleteItem(id) {
  items = items.filter(i => i.id !== id);
  saveToLocalStorage();
  render();
}

function startEdit(item) {
  nameInput.value = item.name;
  teacherInput.value = item.teacher;
  courseSelect.value = item.course;
  prioritySelect.value = item.priority;
  noteInput.value = item.note;

  editId = item.id;
}

function formatDate(date) {
  return date.toLocaleString("uk-UA");
}

 // RENDER
function render() {
  tableBody.innerHTML = "";

  let filteredItems = [...items];

  if (filterPriority.value) {
    filteredItems = filteredItems.filter(
      i => i.priority === filterPriority.value
    );
  }

  filteredItems.sort((a, b) =>
    sortDate.value === "new"
      ? b.createdAt - a.createdAt
      : a.createdAt - b.createdAt
  );

  for (let item of filteredItems) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.teacher}</td>
      <td>${item.course}</td>
      <td>${item.priority}</td>
      <td>${item.note}</td>
      <td>${formatDate(item.createdAt)}</td>
      <td>
        <button class="edit">Редагувати</button>
        <button class="delete">Видалити</button>
      </td>
    `;

    tr.querySelector(".edit").onclick = () => startEdit(item);
    tr.querySelector(".delete").onclick = () => deleteItem(item.id);

    tableBody.appendChild(tr);
  }
}

form.onsubmit = (e) => {
  e.preventDefault();

  const data = readForm();
  if (!validate(data)) return;

  saveItem(data);
  render();
  clearForm();
};

resetBtn.onclick = clearForm;

sortDate.onchange = render;
filterPriority.onchange = render;

function clearForm() {
  form.reset();
  clearErrors();
  editId = null;
}

render();