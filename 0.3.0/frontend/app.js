const API_BASE = "http://localhost:3000/api";
const STORAGE_KEYS = {
  items: "student-cabinet-items",
  user: "student-cabinet-user"
};
const DIGITS_REGEX = /\d/;

const form = document.getElementById("createForm");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const statusMessage = document.getElementById("statusMessage");
const tableBody = document.getElementById("tableBody");
const nameInput = document.getElementById("nameInput");
const teacherInput = document.getElementById("teacherInput");
const courseSelect = document.getElementById("courseSelect");
const prioritySelect = document.getElementById("prioritySelect");
const noteInput = document.getElementById("noteInput");
const sortDate = document.getElementById("sortDate");
const filterPriority = document.getElementById("filterPriority");

const userToggleBtn = document.getElementById("userToggleBtn");
const userPanel = document.getElementById("userPanel");
const userNameInput = document.getElementById("userNameInput");
const userEmailInput = document.getElementById("userEmailInput");
const loginUserSelect = document.getElementById("loginUserSelect");
const saveUserBtn = document.getElementById("saveUserBtn");
const loginUserBtn = document.getElementById("loginUserBtn");
const deleteUserBtn = document.getElementById("deleteUserBtn");
const closeUserBtn = document.getElementById("closeUserBtn");

const errors = {
  title: document.getElementById("nameError"),
  teacher: document.getElementById("teacherError"),
  course: document.getElementById("courseError"),
  priority: document.getElementById("priorityError"),
  note: document.getElementById("noteError"),
  userName: document.getElementById("userNameError"),
  userEmail: document.getElementById("userEmailError")
};

const state = {
  items: [],
  editId: null,
  mode: "server",
  currentUser: readStoredUser(),
  availableUsers: []
};

function readStoredUser() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEYS.user);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function saveStoredUser(user) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  state.currentUser = user;
}

function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEYS.user);
  state.currentUser = null;
}

function readStoredItems() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEYS.items);
    return rawValue ? JSON.parse(rawValue) : [];
  } catch {
    return [];
  }
}

function saveStoredItems(items) {
  localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(items));
}

function isNetworkError(error) {
  return error instanceof TypeError;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.error?.message || "Помилка запиту");
    error.details = data?.error?.details || [];
    error.status = response.status;
    throw error;
  }

  return data;
}

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type ? `status ${type}` : "status";
}

function clearErrors() {
  document.querySelectorAll(".invalid").forEach(element => {
    element.classList.remove("invalid");
  });

  Object.values(errors).forEach(errorElement => {
    errorElement.textContent = "";
  });
}

function showError(input, errorElement, message) {
  input.classList.add("invalid");
  errorElement.textContent = message;
}

function sanitizeTextInput(input, errorElement, message) {
  const cleanValue = input.value.replace(/\d+/g, "");

  if (cleanValue !== input.value) {
    input.value = cleanValue;
    showError(input, errorElement, message);
    return;
  }

  input.classList.remove("invalid");
  errorElement.textContent = "";
}

function readForm() {
  return {
    title: nameInput.value.trim(),
    teacher: teacherInput.value.trim(),
    course: courseSelect.value,
    priority: prioritySelect.value,
    note: noteInput.value.trim()
  };
}

function validateForm(data) {
  let isValid = true;
  clearErrors();

  if (!data.title) {
    showError(nameInput, errors.title, "Обов'язкове поле");
    isValid = false;
  } else if (DIGITS_REGEX.test(data.title)) {
    showError(nameInput, errors.title, "Назва не може містити цифри");
    isValid = false;
  }

  if (!data.teacher) {
    showError(teacherInput, errors.teacher, "Обов'язкове поле");
    isValid = false;
  } else if (DIGITS_REGEX.test(data.teacher)) {
    showError(teacherInput, errors.teacher, "Ім'я викладача не може містити цифри");
    isValid = false;
  }

  if (!data.course) {
    showError(courseSelect, errors.course, "Оберіть курс");
    isValid = false;
  }

  if (!data.priority) {
    showError(prioritySelect, errors.priority, "Оберіть пріоритет");
    isValid = false;
  }

  if (!data.note) {
    showError(noteInput, errors.note, "Обов'язкове поле");
    isValid = false;
  }

  return isValid;
}

function validateUserForm() {
  let isValid = true;

  userNameInput.classList.remove("invalid");
  userEmailInput.classList.remove("invalid");
  errors.userName.textContent = "";
  errors.userEmail.textContent = "";

  if (!userNameInput.value.trim()) {
    showError(userNameInput, errors.userName, "Введи ім'я користувача");
    isValid = false;
  }

  const email = userEmailInput.value.trim();

  if (!email) {
    showError(userEmailInput, errors.userEmail, "Введи email");
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(userEmailInput, errors.userEmail, "Вкажи коректний email");
    isValid = false;
  }

  return isValid;
}

function applyBackendErrors(error) {
  if (!Array.isArray(error.details)) {
    return;
  }

  error.details.forEach(detail => {
    if (detail.field === "title") {
      showError(nameInput, errors.title, detail.message);
    }

    if (detail.field === "teacher") {
      showError(teacherInput, errors.teacher, detail.message);
    }

    if (detail.field === "course") {
      showError(courseSelect, errors.course, detail.message);
    }

    if (detail.field === "priority") {
      showError(prioritySelect, errors.priority, detail.message);
    }

    if (detail.field === "note") {
      showError(noteInput, errors.note, detail.message);
    }

    if (detail.field === "userId") {
      setStatus(detail.message, "error");
    }
  });
}

function clearForm() {
  form.reset();
  clearErrors();
  state.editId = null;
  formTitle.textContent = "Новий запис";
  submitBtn.textContent = "Додати";
  resetBtn.textContent = "Очистити";
}

function fillUserForm() {
  userNameInput.value = state.currentUser?.fullName || "";
  userEmailInput.value = state.currentUser?.email || "";
}

function updateUserButton() {
  if (state.currentUser?.fullName) {
    userToggleBtn.textContent = `Користувач: ${state.currentUser.fullName}`;
    return;
  }

  userToggleBtn.textContent = "Користувач";
}

function toggleUserPanel(forceOpen) {
  const shouldOpen =
    typeof forceOpen === "boolean"
      ? forceOpen
      : userPanel.classList.contains("hidden");

  userPanel.classList.toggle("hidden", !shouldOpen);
}

function buildLocalUserPayload() {
  return {
    localId: state.currentUser?.localId || `local-user-${Date.now()}`,
    serverId: state.currentUser?.serverId || null,
    fullName: userNameInput.value.trim(),
    email: userEmailInput.value.trim()
  };
}

function buildUserRequestBody(user) {
  return {
    fullName: user.fullName,
    email: user.email
  };
}

function buildStoredUserFromServer(serverUser) {
  return {
    localId: `server-user-${serverUser.id}`,
    serverId: serverUser.id,
    fullName: serverUser.fullName,
    email: serverUser.email
  };
}

function findItemById(id) {
  if (!id) {
    return null;
  }

  return state.items.find(item => item.id === id) || readStoredItems().find(item => item.id === id) || null;
}

function renderAvailableUsers() {
  const selectedId = state.currentUser?.serverId || "";

  loginUserSelect.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent =
    state.availableUsers.length > 0
      ? "Оберіть користувача з сервера"
      : "Серверних користувачів поки немає";
  loginUserSelect.appendChild(placeholderOption);

  state.availableUsers.forEach(user => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${user.fullName} (${user.email})`;

    if (selectedId === user.id) {
      option.selected = true;
    }

    loginUserSelect.appendChild(option);
  });

  const hasServerUsers = state.mode === "server" && state.availableUsers.length > 0;
  loginUserSelect.disabled = !hasServerUsers;
  loginUserBtn.disabled = !hasServerUsers;
}

async function trySwitchToServerMode() {
  try {
    await apiRequest("/users");
    state.mode = "server";
    return true;
  } catch (error) {
    if (isNetworkError(error)) {
      return false;
    }

    throw error;
  }
}

async function loadAvailableUsers(options = {}) {
  const { silentError = true } = options;

  try {
    const data = await apiRequest("/users?page=1&pageSize=100&sortDir=desc");
    state.availableUsers = data.items;
    state.mode = "server";
    renderAvailableUsers();
    return true;
  } catch (error) {
    if (isNetworkError(error)) {
      state.availableUsers = [];
      state.mode = "local";
      renderAvailableUsers();
      return false;
    }

    if (!silentError) {
      setStatus(error.message || "Не вдалося отримати список користувачів", "error");
    }

    state.availableUsers = [];
    renderAvailableUsers();
    return false;
  }
}

async function createUserOnServer(localUser) {
  const savedUser = await apiRequest("/users", {
    method: "POST",
    body: JSON.stringify(buildUserRequestBody(localUser))
  });

  return buildStoredUserFromServer(savedUser);
}

async function syncUserWithServer(localUser) {
  if (!localUser.serverId) {
    return createUserOnServer(localUser);
  }

  try {
    const serverUser = await apiRequest(`/users/${localUser.serverId}`);
    const shouldUpdate =
      serverUser.fullName !== localUser.fullName ||
      serverUser.email !== localUser.email;

    if (!shouldUpdate) {
      return buildStoredUserFromServer(serverUser);
    }

    const updatedUser = await apiRequest(`/users/${localUser.serverId}`, {
      method: "PUT",
      body: JSON.stringify(buildUserRequestBody(localUser))
    });

    return buildStoredUserFromServer(updatedUser);
  } catch (error) {
    if (error.status === 404) {
      return createUserOnServer({
        ...localUser,
        serverId: null
      });
    }

    throw error;
  }
}

async function saveUser() {
  if (!validateUserForm()) {
    return;
  }

  let localUser = buildLocalUserPayload();
  let savedOnServer = false;

  try {
    const serverAvailable = await trySwitchToServerMode();

    if (serverAvailable) {
      localUser = await syncUserWithServer(localUser);
      savedOnServer = true;
      await loadAvailableUsers();
    } else {
      state.mode = "local";
    }
  } catch (error) {
    if (!isNetworkError(error)) {
      setStatus(error.message || "Не вдалося зберегти користувача", "error");
      return;
    }

    state.mode = "local";
  }

  saveStoredUser(localUser);
  fillUserForm();
  updateUserButton();
  renderAvailableUsers();
  toggleUserPanel(false);
  await refreshItems({ silentSuccess: true, silentError: true });
  setStatus(
    savedOnServer
      ? "Користувача збережено на сервері"
      : "Сервер недоступний, користувача збережено тільки локально",
    savedOnServer ? "success" : "error"
  );
}

async function loginUser() {
  const selectedUserId = loginUserSelect.value;

  if (!selectedUserId) {
    setStatus("Оберіть користувача зі списку, щоб увійти", "error");
    return;
  }

  try {
    const serverUser = await apiRequest(`/users/${selectedUserId}`);
    const localUser = buildStoredUserFromServer(serverUser);

    saveStoredUser(localUser);
    fillUserForm();
    updateUserButton();
    renderAvailableUsers();
    toggleUserPanel(false);
    await refreshItems({ silentSuccess: true, silentError: true });
    setStatus(`Вхід виконано як ${serverUser.fullName}`, "success");
  } catch (error) {
    if (isNetworkError(error)) {
      state.mode = "local";
      state.availableUsers = [];
      renderAvailableUsers();
      setStatus("Сервер недоступний, увійти в існуючого користувача зараз не можна", "error");
      return;
    }

    if (error.status === 404) {
      await loadAvailableUsers({ silentError: true });
      setStatus("Цього користувача вже немає на сервері, список оновлено", "error");
      return;
    }

    setStatus(error.message || "Не вдалося виконати вхід", "error");
  }
}

async function ensureCurrentUser() {
  if (!state.currentUser?.fullName || !state.currentUser?.email) {
    throw new Error("Спочатку збережи користувача або увійди через кнопку справа зверху");
  }

  try {
    const serverAvailable = await trySwitchToServerMode();

    if (!serverAvailable) {
      state.mode = "local";
      return state.currentUser;
    }

    const syncedUser = await syncUserWithServer(state.currentUser);
    saveStoredUser(syncedUser);
    updateUserButton();
    renderAvailableUsers();
    return syncedUser;
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error;
    }

    state.mode = "local";
    return state.currentUser;
  }
}

function resetUserState() {
  clearStoredUser();
  fillUserForm();
  updateUserButton();
  renderAvailableUsers();
  toggleUserPanel(false);
  clearErrors();
}

async function deleteUser() {
  if (!state.currentUser) {
    setStatus("Збереженого користувача немає", "error");
    return;
  }

  if (!window.confirm("Видалити збереженого користувача?")) {
    return;
  }

  const serverId = state.currentUser.serverId;

  try {
    const serverAvailable = await trySwitchToServerMode();

    if (serverAvailable && serverId) {
      try {
        await apiRequest(`/users/${serverId}`, {
          method: "DELETE"
        });
      } catch (error) {
        if (!isNetworkError(error) && error.status !== 404) {
          setStatus(error.message || "Не вдалося видалити користувача", "error");
          return;
        }
      }
    } else if (!serverAvailable) {
      state.mode = "local";
    }

    resetUserState();
    await loadAvailableUsers({ silentError: true });
    await refreshItems({ silentSuccess: true, silentError: true });
    setStatus(
      serverId && state.mode === "local"
        ? "Сервер недоступний, користувача видалено тільки з localStorage"
        : "Користувача видалено",
      serverId && state.mode === "local" ? "error" : "success"
    );
  } catch (error) {
    if (!isNetworkError(error)) {
      setStatus(error.message || "Не вдалося видалити користувача", "error");
      return;
    }

    state.mode = "local";
    resetUserState();
    await refreshItems({ silentSuccess: true, silentError: true });
    setStatus("Сервер недоступний, користувача видалено тільки з localStorage", "error");
  }
}

function startEdit(item) {
  state.editId = item.id;
  nameInput.value = item.title;
  teacherInput.value = item.teacher;
  courseSelect.value = item.course;
  prioritySelect.value = item.priority;
  noteInput.value = item.note;
  clearErrors();
  formTitle.textContent = "Редагування запису";
  submitBtn.textContent = "Зберегти";
  resetBtn.textContent = "Скасувати";
  setStatus(`Редагування запису "${item.title}"`, "success");
}

function renderTable() {
  tableBody.innerHTML = "";

  if (state.items.length === 0) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    row.innerHTML = "<td colspan=\"8\">Поки що записів немає.</td>";
    tableBody.appendChild(row);
    return;
  }

  state.items.forEach(item => {
    const row = document.createElement("tr");
    const userCell = `
      <div class="user-name">${item.userFullName || "Без користувача"}</div>
      <div class="user-email">${item.userEmail || ""}</div>
    `;

    row.innerHTML = `
      <td>${item.title}</td>
      <td>${item.teacher}</td>
      <td>${item.course}</td>
      <td>${item.priority}</td>
      <td>${item.note}</td>
      <td>${userCell}</td>
      <td>${new Date(item.createdAt).toLocaleString("uk-UA")}</td>
      <td><div class="actions"></div></td>
    `;

    const actions = row.querySelector(".actions");
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Редагувати";
    editButton.addEventListener("click", () => startEdit(item));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete";
    deleteButton.textContent = "Видалити";
    deleteButton.addEventListener("click", () => deleteItem(item.id));

    actions.append(editButton, deleteButton);
    tableBody.appendChild(row);
  });
}

function getFilteredLocalItems() {
  let items = readStoredItems();

  if (filterPriority.value) {
    items = items.filter(item => item.priority === filterPriority.value);
  }

  items = [...items].sort((left, right) => {
    const leftDate = new Date(left.createdAt).getTime();
    const rightDate = new Date(right.createdAt).getTime();

    return sortDate.value === "asc"
      ? leftDate - rightDate
      : rightDate - leftDate;
  });

  return items.slice(0, 10);
}

async function loadItemsFromServer() {
  const params = new URLSearchParams({
    page: "1",
    pageSize: "10",
    sortDir: sortDate.value
  });

  if (filterPriority.value) {
    params.set("priority", filterPriority.value);
  }

  const data = await apiRequest(`/names/with-users?${params.toString()}`);
  state.items = data.items;
  saveStoredItems(data.items);
  state.mode = "server";
  renderTable();
}

function loadItemsFromLocalStorage() {
  state.items = getFilteredLocalItems();
  state.mode = "local";
  renderTable();
}

async function refreshItems(options = {}) {
  const { silentSuccess = false, silentError = false } = options;

  try {
    await loadItemsFromServer();

    if (!silentSuccess) {
      setStatus("Дані з сервера завантажено", "success");
    }
  } catch (error) {
    if (!isNetworkError(error)) {
      if (!silentError) {
        setStatus(error.message || "Не вдалося отримати записи", "error");
      }

      return;
    }

    loadItemsFromLocalStorage();

    if (!silentError) {
      setStatus("Сервер недоступний, використовується localStorage", "error");
    }
  }
}

function buildLocalItem(formData, user) {
  const existingItem = findItemById(state.editId);
  const ownerId = existingItem?.userId || user?.localId;
  const ownerName = existingItem?.userFullName || user?.fullName || "Локальний користувач";
  const ownerEmail = existingItem?.userEmail || user?.email || "";

  if (!ownerId) {
    throw new Error("Спочатку збережи користувача або увійди під існуючим");
  }

  return {
    id: state.editId || `local-item-${Date.now()}`,
    userId: ownerId,
    title: formData.title,
    teacher: formData.teacher,
    course: formData.course,
    priority: formData.priority,
    note: formData.note,
    userFullName: ownerName,
    userEmail: ownerEmail,
    createdAt: existingItem?.createdAt || new Date().toISOString()
  };
}

async function submitServerItem(formData, user) {
  const existingItem = findItemById(state.editId);
  const ownerId = existingItem?.userId || user?.serverId;

  if (!ownerId) {
    throw new Error("Спочатку збережи користувача або увійди під існуючим");
  }

  const payload = {
    userId: ownerId,
    title: formData.title,
    teacher: formData.teacher,
    course: formData.course,
    priority: formData.priority,
    note: formData.note
  };

  if (state.editId) {
    await apiRequest(`/names/${state.editId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    return;
  }

  await apiRequest("/names", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function submitLocalItem(formData, user) {
  const items = readStoredItems();
  const nextItem = buildLocalItem(formData, user);
  const nextItems = state.editId
    ? items.map(item => (item.id === state.editId ? nextItem : item))
    : [nextItem, ...items];

  saveStoredItems(nextItems);
}

async function submitForm(event) {
  event.preventDefault();

  const data = readForm();

  if (!validateForm(data)) {
    return;
  }

  try {
    const existingItem = findItemById(state.editId);
    const user = existingItem ? state.currentUser : await ensureCurrentUser();

    if (state.mode === "server") {
      try {
        await submitServerItem(data, user);
        setStatus(
          state.editId ? "Запис оновлено на сервері" : "Запис додано на сервер",
          "success"
        );
      } catch (error) {
        if (!isNetworkError(error)) {
          applyBackendErrors(error);
          setStatus(error.message || "Не вдалося зберегти запис", "error");
          return;
        }

        state.mode = "local";
        submitLocalItem(data, user);
        setStatus("Сервер недоступний, запис збережено у localStorage", "error");
      }
    } else {
      submitLocalItem(data, user);
      setStatus(
        state.editId ? "Запис оновлено у localStorage" : "Запис додано у localStorage",
        "success"
      );
    }

    clearForm();
    await refreshItems({ silentSuccess: true, silentError: true });
  } catch (error) {
    setStatus(error.message || "Не вдалося зберегти запис", "error");
  }
}

async function deleteItem(id) {
  if (!window.confirm("Видалити цей запис?")) {
    return;
  }

  try {
    if (state.mode === "server") {
      try {
        await apiRequest(`/names/${id}`, {
          method: "DELETE"
        });
        setStatus("Запис видалено з сервера", "success");
      } catch (error) {
        if (!isNetworkError(error)) {
          setStatus(error.message || "Не вдалося видалити запис", "error");
          return;
        }

        state.mode = "local";
        const items = readStoredItems().filter(item => item.id !== id);
        saveStoredItems(items);
        setStatus("Сервер недоступний, запис видалено локально", "error");
      }
    } else {
      const items = readStoredItems().filter(item => item.id !== id);
      saveStoredItems(items);
      setStatus("Запис видалено з localStorage", "success");
    }

    if (state.editId === id) {
      clearForm();
    }

    await refreshItems({ silentSuccess: true, silentError: true });
  } catch (error) {
    setStatus(error.message || "Не вдалося видалити запис", "error");
  }
}

async function initialize() {
  fillUserForm();
  updateUserButton();
  renderAvailableUsers();
  await loadAvailableUsers({ silentError: true });
  await refreshItems({ silentSuccess: true, silentError: false });
}

nameInput.addEventListener("input", () => {
  sanitizeTextInput(nameInput, errors.title, "Назва не може містити цифри");
});

teacherInput.addEventListener("input", () => {
  sanitizeTextInput(
    teacherInput,
    errors.teacher,
    "Ім'я викладача не може містити цифри"
  );
});

userToggleBtn.addEventListener("click", async () => {
  fillUserForm();
  toggleUserPanel();

  if (!userPanel.classList.contains("hidden")) {
    await loadAvailableUsers({ silentError: true });
  }
});

closeUserBtn.addEventListener("click", () => {
  toggleUserPanel(false);
});

saveUserBtn.addEventListener("click", saveUser);
loginUserBtn.addEventListener("click", loginUser);
deleteUserBtn.addEventListener("click", deleteUser);
form.addEventListener("submit", submitForm);
resetBtn.addEventListener("click", clearForm);
sortDate.addEventListener("change", () => refreshItems({ silentSuccess: true, silentError: false }));
filterPriority.addEventListener("change", () =>
  refreshItems({ silentSuccess: true, silentError: false })
);

initialize();
