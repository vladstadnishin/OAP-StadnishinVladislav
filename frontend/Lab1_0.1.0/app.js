let items = [];
let nextId = 1;

const form = document.getElementById("createForm");
const resetBtn = document.getElementById("resetBtn");
const tableBody = document.getElementById("tableBody");
const nameInput = document.getElementById("nameInput");
const teacherInput = document.getElementById("teacherInput");
const courseSelect = document.getElementById("courseSelect");
const noteInput = document.getElementById("noteInput");

const errors = {
  name: document.getElementById("nameError"),
  teacher: document.getElementById("teacherError"),
  course: document.getElementById("courseError"),
  note: document.getElementById("noteError")
};

function readForm() {
  return {
    name: nameInput.value.trim(),
    teacher: teacherInput.value.trim(),
    course: courseSelect.value,
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

  if (!data.note) {
    showError(noteInput, errors.note, "Додайте запис");
    valid = false;
  }

  return valid;
}

function showError(input, errorElem, message) {
  input.classList.add("invalid");
  errorElem.textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".invalid").forEach(el =>
    el.classList.remove("invalid")
  );
  Object.values(errors).forEach(e => e.textContent = "");
}

function addItem(data) {
  items.push({
    id: nextId++,
    ...data,
    createdAt: new Date()
  });
}

function formatDate(date) {
  return date.toLocaleString("uk-UA");
}

function render() {
  tableBody.innerHTML = "";

  for (let item of items) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.teacher}</td>
      <td>${item.course}</td>
      <td>${item.note}</td>
      <td>${formatDate(item.createdAt)}</td>
      <td><button>Видалити</button></td>
    `;

    tr.querySelector("button").onclick = () => deleteItem(item.id);
    tableBody.appendChild(tr);
  }
}

function deleteItem(id) {
  items = items.filter(i => i.id !== id);
  render();
}

function clearForm() {
  form.reset();
  clearErrors();
}

form.onsubmit = (e) => {
  e.preventDefault();

  const data = readForm();
  if (!validate(data)) return;

  addItem(data);
  render();
  clearForm();
};

resetBtn.onclick = clearForm;