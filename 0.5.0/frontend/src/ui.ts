import type {
  ApiErrorDto,
  Course,
  Id,
  NameDto,
  NameFormDto,
  NameWithUserDto,
  Priority,
  StoredUser,
  UiMode,
  UserDto
} from "./dtos.js";

const DIGITS_REGEX = /\d/;

type StatusType = "" | "success" | "error";

interface TableCallbacks {
  onDetails(id: Id): void;
  onEdit(id: Id): void;
  onDelete(id: Id): void;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Element #${id} not found`);
  }

  return element as T;
}

// Усі DOM-посилання зібрані тут, щоб основна логіка не шукала елементи повторно.
export const elements = {
  form: getElement<HTMLFormElement>("createForm"),
  formTitle: getElement<HTMLHeadingElement>("formTitle"),
  submitBtn: getElement<HTMLButtonElement>("submitBtn"),
  resetBtn: getElement<HTMLButtonElement>("resetBtn"),
  statusMessage: getElement<HTMLParagraphElement>("statusMessage"),
  listStatus: getElement<HTMLParagraphElement>("listStatus"),
  tableBody: getElement<HTMLTableSectionElement>("tableBody"),
  nameInput: getElement<HTMLInputElement>("nameInput"),
  teacherInput: getElement<HTMLInputElement>("teacherInput"),
  courseSelect: getElement<HTMLSelectElement>("courseSelect"),
  prioritySelect: getElement<HTMLSelectElement>("prioritySelect"),
  noteInput: getElement<HTMLTextAreaElement>("noteInput"),
  sortDate: getElement<HTMLSelectElement>("sortDate"),
  filterPriority: getElement<HTMLSelectElement>("filterPriority"),
  prevPageBtn: getElement<HTMLButtonElement>("prevPageBtn"),
  nextPageBtn: getElement<HTMLButtonElement>("nextPageBtn"),
  pageInfo: getElement<HTMLSpanElement>("pageInfo"),
  detailsStatus: getElement<HTMLParagraphElement>("detailsStatus"),
  detailsList: getElement<HTMLDListElement>("detailsList"),
  closeDetailsBtn: getElement<HTMLButtonElement>("closeDetailsBtn"),
  userToggleBtn: getElement<HTMLButtonElement>("userToggleBtn"),
  userPanel: getElement<HTMLElement>("userPanel"),
  userNameInput: getElement<HTMLInputElement>("userNameInput"),
  userEmailInput: getElement<HTMLInputElement>("userEmailInput"),
  loginUserSelect: getElement<HTMLSelectElement>("loginUserSelect"),
  saveUserBtn: getElement<HTMLButtonElement>("saveUserBtn"),
  loginUserBtn: getElement<HTMLButtonElement>("loginUserBtn"),
  logoutUserBtn: getElement<HTMLButtonElement>("logoutUserBtn"),
  deleteUserBtn: getElement<HTMLButtonElement>("deleteUserBtn"),
  closeUserBtn: getElement<HTMLButtonElement>("closeUserBtn"),
  errors: {
    title: getElement<HTMLParagraphElement>("nameError"),
    teacher: getElement<HTMLParagraphElement>("teacherError"),
    course: getElement<HTMLParagraphElement>("courseError"),
    priority: getElement<HTMLParagraphElement>("priorityError"),
    note: getElement<HTMLParagraphElement>("noteError"),
    userName: getElement<HTMLParagraphElement>("userNameError"),
    userEmail: getElement<HTMLParagraphElement>("userEmailError")
  }
};

export function setStatus(message: string, type: StatusType = ""): void {
  // Загальний статус показує результат дій: створення, редагування, видалення.
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = type ? `status ${type}` : "status";
}

export function setListStatus(message: string, type: StatusType = ""): void {
  // Окремий статус списку потрібен для loading / empty / error станів таблиці.
  elements.listStatus.textContent = message;
  elements.listStatus.className = type ? `list-status ${type}` : "list-status";
}

export function setDetailsStatus(message: string, type: StatusType = ""): void {
  elements.detailsStatus.textContent = message;
  elements.detailsStatus.className = type ? `list-status ${type}` : "list-status";
}

export function clearErrors(): void {
  // Перед новою перевіркою прибираємо старі помилки, щоб користувач бачив актуальний стан.
  document.querySelectorAll(".invalid").forEach(element => {
    element.classList.remove("invalid");
  });

  Object.values(elements.errors).forEach(errorElement => {
    errorElement.textContent = "";
  });
}

function showError(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  errorElement: HTMLElement,
  message: string
): void {
  input.classList.add("invalid");
  errorElement.textContent = message;
}

export function sanitizeTextInput(
  input: HTMLInputElement,
  errorElement: HTMLElement,
  message: string
): void {
  // Фронтенд-валідація дублює серверне правило: назва і викладач без цифр.
  const cleanValue = input.value.replace(/\d+/g, "");

  if (cleanValue !== input.value) {
    input.value = cleanValue;
    showError(input, errorElement, message);
    return;
  }

  input.classList.remove("invalid");
  errorElement.textContent = "";
}

export function readForm(): NameFormDto {
  return {
    title: elements.nameInput.value.trim(),
    teacher: elements.teacherInput.value.trim(),
    course: elements.courseSelect.value as Course | "",
    priority: elements.prioritySelect.value as Priority | "",
    note: elements.noteInput.value.trim()
  };
}

export function validateForm(data: NameFormDto): data is NameFormDto & {
  course: Course;
  priority: Priority;
} {
  // Обмеження узгоджені із Zod-схемами бекенду для основної сутності.
  let isValid = true;
  clearErrors();

  if (!data.title) {
    showError(elements.nameInput, elements.errors.title, "Обов'язкове поле");
    isValid = false;
  } else if (data.title.length < 2 || data.title.length > 80) {
    showError(elements.nameInput, elements.errors.title, "Назва має містити від 2 до 80 символів");
    isValid = false;
  } else if (DIGITS_REGEX.test(data.title)) {
    showError(elements.nameInput, elements.errors.title, "Назва не може містити цифри");
    isValid = false;
  }

  if (!data.teacher) {
    showError(elements.teacherInput, elements.errors.teacher, "Обов'язкове поле");
    isValid = false;
  } else if (data.teacher.length < 2 || data.teacher.length > 80) {
    showError(
      elements.teacherInput,
      elements.errors.teacher,
      "Ім'я викладача має містити від 2 до 80 символів"
    );
    isValid = false;
  } else if (DIGITS_REGEX.test(data.teacher)) {
    showError(elements.teacherInput, elements.errors.teacher, "Ім'я викладача не може містити цифри");
    isValid = false;
  }

  if (!data.course) {
    showError(elements.courseSelect, elements.errors.course, "Оберіть курс");
    isValid = false;
  }

  if (!data.priority) {
    showError(elements.prioritySelect, elements.errors.priority, "Оберіть пріоритет");
    isValid = false;
  }

  if (!data.note) {
    showError(elements.noteInput, elements.errors.note, "Обов'язкове поле");
    isValid = false;
  } else if (data.note.length < 3 || data.note.length > 200) {
    showError(elements.noteInput, elements.errors.note, "Коментар має містити від 3 до 200 символів");
    isValid = false;
  }

  return isValid;
}

export function validateUserForm(): boolean {
  let isValid = true;

  elements.userNameInput.classList.remove("invalid");
  elements.userEmailInput.classList.remove("invalid");
  elements.errors.userName.textContent = "";
  elements.errors.userEmail.textContent = "";

  const fullName = elements.userNameInput.value.trim();
  const email = elements.userEmailInput.value.trim();

  if (fullName.length < 2 || fullName.length > 80) {
    showError(elements.userNameInput, elements.errors.userName, "Ім'я має містити від 2 до 80 символів");
    isValid = false;
  }

  if (!email) {
    showError(elements.userEmailInput, elements.errors.userEmail, "Введіть email");
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    showError(elements.userEmailInput, elements.errors.userEmail, "Вкажіть коректний email");
    isValid = false;
  }

  return isValid;
}

export function applyBackendErrors(error: ApiErrorDto): void {
  // details з API прив'язуються до конкретних полів форми, якщо бекенд їх назвав.
  error.details.forEach(detail => {
    if (detail.field === "title") {
      showError(elements.nameInput, elements.errors.title, detail.message);
    }

    if (detail.field === "teacher") {
      showError(elements.teacherInput, elements.errors.teacher, detail.message);
    }

    if (detail.field === "course") {
      showError(elements.courseSelect, elements.errors.course, detail.message);
    }

    if (detail.field === "priority") {
      showError(elements.prioritySelect, elements.errors.priority, detail.message);
    }

    if (detail.field === "note") {
      showError(elements.noteInput, elements.errors.note, detail.message);
    }

    if (detail.field === "userId") {
      setStatus(detail.message, "error");
    }
  });
}

export function clearForm(): void {
  elements.form.reset();
  clearErrors();
  elements.formTitle.textContent = "Новий запис";
  elements.submitBtn.textContent = "Додати";
  elements.resetBtn.textContent = "Очистити";
}

export function fillFormForEdit(item: NameDto): void {
  elements.nameInput.value = item.title;
  elements.teacherInput.value = item.teacher;
  elements.courseSelect.value = item.course;
  elements.prioritySelect.value = item.priority;
  elements.noteInput.value = item.note;
  clearErrors();
  elements.formTitle.textContent = "Редагування запису";
  elements.submitBtn.textContent = "Зберегти";
  elements.resetBtn.textContent = "Скасувати";
  setStatus(`Редагування запису "${item.title}"`, "success");
}

export function fillUserForm(user: StoredUser | null): void {
  elements.userNameInput.value = user?.fullName ?? "";
  elements.userEmailInput.value = user?.email ?? "";
}

export function updateUserButton(user: StoredUser | null): void {
  elements.userToggleBtn.textContent = user?.fullName
    ? `Користувач: ${user.fullName}`
    : "Користувач";
}

export function toggleUserPanel(forceOpen?: boolean): void {
  const shouldOpen =
    typeof forceOpen === "boolean"
      ? forceOpen
      : elements.userPanel.classList.contains("hidden");

  elements.userPanel.classList.toggle("hidden", !shouldOpen);
}

export function renderAvailableUsers(
  users: UserDto[],
  currentUser: StoredUser | null,
  mode: UiMode
): void {
  // Список входу активний тільки тоді, коли сервер доступний і повернув користувачів.
  const selectedId = currentUser?.serverId ?? "";
  // Очищаємо DOM-вузли без innerHTML, щоб не змішувати дані користувача з HTML.
  elements.loginUserSelect.replaceChildren();

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent =
    users.length > 0
      ? "Оберіть користувача з сервера"
      : "Серверних користувачів поки немає";
  elements.loginUserSelect.appendChild(placeholderOption);

  users.forEach(user => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${user.fullName} (${user.email})`;
    option.selected = selectedId === user.id;
    elements.loginUserSelect.appendChild(option);
  });

  const hasServerUsers = mode === "server" && users.length > 0;
  elements.loginUserSelect.disabled = !hasServerUsers;
  elements.loginUserBtn.disabled = !hasServerUsers;
  elements.logoutUserBtn.disabled = !currentUser;
}

export function renderTable(items: NameWithUserDto[], callbacks: TableCallbacks): void {
  // Рядки створюються через DOM API, щоб не вставляти дані користувача як HTML.
  elements.tableBody.replaceChildren();

  if (items.length === 0) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.textContent = "Поки що записів немає.";
    row.appendChild(cell);
    elements.tableBody.appendChild(row);
    return;
  }

  items.forEach(item => {
    const row = document.createElement("tr");
    const values = [
      item.title,
      item.teacher,
      `${item.course} курс`,
      item.priority,
      item.note,
      `${item.userFullName}${item.userEmail ? ` (${item.userEmail})` : ""}`,
      new Date(item.createdAt).toLocaleString("uk-UA")
    ];

    values.forEach(value => {
      const cell = document.createElement("td");
      // textContent показує payload як текст і не дає браузеру виконати HTML/JS.
      cell.textContent = value;
      row.appendChild(cell);
    });

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "actions";

    const detailsButton = document.createElement("button");
    detailsButton.type = "button";
    detailsButton.className = "secondary";
    detailsButton.textContent = "Деталі";
    detailsButton.addEventListener("click", () => callbacks.onDetails(item.id));

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Редагувати";
    editButton.addEventListener("click", () => callbacks.onEdit(item.id));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete";
    deleteButton.textContent = "Видалити";
    deleteButton.addEventListener("click", () => callbacks.onDelete(item.id));

    actions.append(detailsButton, editButton, deleteButton);
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);
    elements.tableBody.appendChild(row);
  });
}

export function renderPagination(page: number, pageSize: number, total: number, mode: UiMode): void {
  // Пагінація працює і для серверного списку, і для локальної копії з localStorage.
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  elements.pageInfo.textContent =
    mode === "local"
      ? `Сторінка ${page} з ${totalPages} (localStorage)`
      : `Сторінка ${page} з ${totalPages}, записів: ${total}`;
  elements.prevPageBtn.disabled = page <= 1;
  elements.nextPageBtn.disabled = page >= totalPages;
}

export function renderDetails(item: NameDto | null): void {
  // Деталі окремо демонструють другий GET endpoint лабораторної.
  elements.detailsList.replaceChildren();

  if (!item) {
    setDetailsStatus("Оберіть запис у таблиці.");
    return;
  }

  setDetailsStatus("Деталі завантажено", "success");

  const rows = [
    ["ID", item.id],
    ["Користувач", item.userId],
    ["Назва", item.title],
    ["Викладач", item.teacher],
    ["Курс", `${item.course} курс`],
    ["Пріоритет", item.priority],
    ["Запис", item.note],
    ["Створено", new Date(item.createdAt).toLocaleString("uk-UA")]
  ];

  rows.forEach(([label, value]) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    // Навіть збережені в БД дані лишаються недовіреними, тому тільки textContent.
    description.textContent = value;
    elements.detailsList.append(term, description);
  });
}

export function setFormBusy(isBusy: boolean): void {
  // На час запиту блокуємо кнопку, щоб не створити дублікати подвійним кліком.
  elements.submitBtn.disabled = isBusy;
  elements.resetBtn.disabled = isBusy;
}

export function setUserBusy(isBusy: boolean): void {
  elements.saveUserBtn.disabled = isBusy;
  elements.logoutUserBtn.disabled = isBusy;
  elements.deleteUserBtn.disabled = isBusy;
}
