const API_URL = "http://localhost:3000/api/personal-notes";
const USERS_API_URL = "http://localhost:3000/api/users";
let currentUserId = localStorage.getItem("currentUserId") || "demo-user";

let items = JSON.parse(localStorage.getItem("items")) || [];

items.forEach(item => {
  item.createdAt = new Date(item.createdAt);
});

let editId = null;

function saveToLocalStorage() {
  localStorage.setItem("items", JSON.stringify(items));
}

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

const userForm = document.getElementById("userForm");
const openMenuBtn = document.getElementById("openMenuBtn");
const menu = document.getElementById("menu");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");

const errors = {
  name: document.getElementById("nameError"),
  teacher: document.getElementById("teacherError"),
  course: document.getElementById("courseError"),
  priority: document.getElementById("priorityError"),
  note: document.getElementById("noteError")
};

async function syncToServer(item) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: currentUserId,
      title: item.name,
      content: JSON.stringify({
        note: item.note,
        teacher: item.teacher,
        course: item.course,
        priority: item.priority
      }),
      teacher: item.teacher,
      course: item.course,
      priority: item.priority
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Не вдалося зберегти запис на сервері");
  }

  return data;
}

async function tryLoadFromServer() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!res.ok || !Array.isArray(data.items)) {
      throw new Error("Не вдалося завантажити записи");
    }

    const existingIds = new Set(items.map(item => String(item.id)));

    data.items.forEach(i => {
      if (existingIds.has(String(i.id))) {
        return;
      }

      let parsedContent = {};

      try {
        parsedContent = JSON.parse(i.content);
      } catch {
        parsedContent = { note: i.content };
      }

      items.push({
        id: i.id,
        name: i.title,
        teacher: parsedContent.teacher || i.teacher || "",
        course: parsedContent.course || i.course || "",
        priority: parsedContent.priority || i.priority || "",
        note: parsedContent.note || i.content || "",
        createdAt: new Date(i.createdAt)
      });
    });

    saveToLocalStorage();
    render();
  } catch {
    console.log("Server not running, using localStorage");
  }
}

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

function showError(input, errorElem, message) {
  input.classList.add("invalid");
  errorElem.textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
  Object.values(errors).forEach(e => {
    e.textContent = "";
  });
}

async function saveItem(data) {
  if (editId === null) {
    const localItem = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date()
    };

    items.push(localItem);
    saveToLocalStorage();
    render();

    try {
      const savedItem = await syncToServer(localItem);
      localItem.id = savedItem.id;
      localItem.createdAt = new Date(savedItem.createdAt);
      saveToLocalStorage();
      render();
    } catch (e) {
      console.error(e);
      alert(e.message || "Не вдалося зберегти запис на сервері");
    }

    return;
  }

  const index = items.findIndex(i => i.id === editId);
  if (index !== -1) {
    items[index] = {
      ...items[index],
      ...data
    };
  }
  editId = null;
  saveToLocalStorage();
  render();
}

async function deleteItem(id) {
  items = items.filter(i => i.id !== id);
  saveToLocalStorage();
  render();

  try {
    await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });
  } catch {
    console.log("Server not available");
  }
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

function render() {
  tableBody.innerHTML = "";

  let filteredItems = [...items];

  if (filterPriority.value) {
    filteredItems = filteredItems.filter(i => i.priority === filterPriority.value);
  }

  filteredItems.sort((a, b) =>
    sortDate.value === "new" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
  );

  for (const item of filteredItems) {
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

function clearForm() {
  form.reset();
  clearErrors();
  editId = null;
}

function toggleUserMenu() {
  menu.classList.toggle("hidden");
}

openMenuBtn.addEventListener("click", toggleUserMenu);

userForm.addEventListener("submit", async e => {
  e.preventDefault();

  const name = usernameInput.value.trim();
  const email = emailInput.value.trim();

  if (!name || !email) {
    alert("Введи ім'я та email");
    return;
  }

  try {
    const res = await fetch(USERS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error?.message || "Не вдалося створити користувача");
    }

    currentUserId = data.id;
    localStorage.setItem("currentUserId", currentUserId);

    alert("Користувача створено!");
    userForm.reset();
    menu.classList.add("hidden");
  } catch (err) {
    console.error(err);
    alert(err.message || "Помилка при відправці");
  }
});

form.onsubmit = async e => {
  e.preventDefault();

  const data = readForm();
  if (!validate(data)) return;

  await saveItem(data);
  clearForm();
};

resetBtn.onclick = clearForm;
sortDate.onchange = render;
filterPriority.onchange = render;

render();
tryLoadFromServer();
