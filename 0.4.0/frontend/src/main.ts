import { DEFAULT_PAGE_SIZE } from "./config.js";
import {
  createName,
  createUser,
  deleteName,
  deleteUserById,
  getNameById,
  getNamesWithUsers,
  getUserById,
  getUsers,
  updateName,
  updateUser
} from "./apiClient.js";
import type {
  ApiErrorDto,
  Course,
  CreateNameRequestDto,
  Id,
  NameDto,
  NameFormDto,
  NameWithUserDto,
  Priority,
  SortDirection,
  StoredUser,
  UiMode,
  UserDto
} from "./dtos.js";
import {
  applyBackendErrors,
  clearForm,
  elements,
  fillFormForEdit,
  fillUserForm,
  readForm,
  renderAvailableUsers,
  renderDetails,
  renderPagination,
  renderTable,
  sanitizeTextInput,
  setDetailsStatus,
  setFormBusy,
  setListStatus,
  setStatus,
  setUserBusy,
  toggleUserPanel,
  updateUserButton,
  validateForm,
  validateUserForm
} from "./ui.js";

const STORAGE_KEYS = {
  items: "student-cabinet-items",
  user: "student-cabinet-user"
};

type ValidNameFormDto = NameFormDto & {
  course: Course;
  priority: Priority;
};

interface AppState {
  items: NameWithUserDto[];
  editId: Id | null;
  mode: UiMode;
  currentUser: StoredUser | null;
  availableUsers: UserDto[];
  page: number;
  pageSize: number;
  total: number;
}

const state: AppState = {
  // Уся змінна частина інтерфейсу живе в одному стані:
  // поточний список, режим server/local, сторінка і вибраний користувач.
  items: [],
  editId: null,
  mode: "server",
  currentUser: readStoredUser(),
  availableUsers: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0
};

function isApiError(error: unknown): error is ApiErrorDto {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error &&
    typeof (error as { status: unknown }).status === "number" &&
    typeof (error as { message: unknown }).message === "string"
  );
}

function isNetworkOrCorsError(error: unknown): boolean {
  // apiClient домовлено повертає status 0 для timeout, мережі або CORS.
  return isApiError(error) && error.status === 0;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (error.status === 500) {
    return "Сервер повернув 500. Перевірте консоль бекенду та повторіть дію.";
  }

  return error.message || fallback;
}

function readStoredUser(): StoredUser | null {
  // localStorage дає можливість працювати з формою навіть без запущеного бекенду.
  try {
    const rawValue = localStorage.getItem(STORAGE_KEYS.user);
    return rawValue ? (JSON.parse(rawValue) as StoredUser) : null;
  } catch {
    return null;
  }
}

function saveStoredUser(user: StoredUser): void {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  state.currentUser = user;
}

function clearStoredUser(): void {
  localStorage.removeItem(STORAGE_KEYS.user);
  state.currentUser = null;
}

function readStoredItems(): NameWithUserDto[] {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEYS.items);
    return rawValue ? (JSON.parse(rawValue) as NameWithUserDto[]) : [];
  } catch {
    return [];
  }
}

function saveStoredItems(items: NameWithUserDto[]): void {
  localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(items));
}

function getSortDirection(): SortDirection {
  return elements.sortDate.value === "asc" ? "asc" : "desc";
}

function getPriorityFilter(): Priority | undefined {
  return elements.filterPriority.value ? (elements.filterPriority.value as Priority) : undefined;
}

function renderUsers(): void {
  renderAvailableUsers(state.availableUsers, state.currentUser, state.mode);
}

function resetFormState(): void {
  state.editId = null;
  clearForm();
}

function findItemById(id: Id | null): NameWithUserDto | null {
  if (!id) {
    return null;
  }

  return state.items.find(item => item.id === id) ?? readStoredItems().find(item => item.id === id) ?? null;
}

function buildLocalUserPayload(): StoredUser {
  return {
    localId: state.currentUser?.localId ?? `local-user-${Date.now()}`,
    serverId: state.currentUser?.serverId ?? null,
    fullName: elements.userNameInput.value.trim(),
    email: elements.userEmailInput.value.trim()
  };
}

function buildUserRequestBody(user: StoredUser) {
  return {
    fullName: user.fullName,
    email: user.email
  };
}

function buildStoredUserFromServer(serverUser: UserDto): StoredUser {
  return {
    localId: `server-user-${serverUser.id}`,
    serverId: serverUser.id,
    fullName: serverUser.fullName,
    email: serverUser.email
  };
}

async function trySwitchToServerMode(): Promise<boolean> {
  // Легкий GET перевіряє, чи можна зараз працювати із сервером.
  try {
    await getUsers({ page: 1, pageSize: 1, sortDir: "desc" });
    state.mode = "server";
    return true;
  } catch (error) {
    if (isNetworkOrCorsError(error)) {
      state.mode = "local";
      return false;
    }

    throw error;
  }
}

async function loadAvailableUsers(options: { silentError?: boolean } = {}): Promise<boolean> {
  const { silentError = true } = options;

  try {
    const data = await getUsers({ page: 1, pageSize: 100, sortDir: "desc" });
    state.availableUsers = data.items;
    state.mode = "server";
    renderUsers();
    return true;
  } catch (error) {
    state.availableUsers = [];

    if (isNetworkOrCorsError(error)) {
      state.mode = "local";
      renderUsers();
      return false;
    }

    renderUsers();

    if (!silentError) {
      setStatus(getErrorMessage(error, "Не вдалося отримати список користувачів"), "error");
    }

    return false;
  }
}

async function createUserOnServer(localUser: StoredUser): Promise<StoredUser> {
  const savedUser = await createUser(buildUserRequestBody(localUser));
  return buildStoredUserFromServer(savedUser);
}

async function syncUserWithServer(localUser: StoredUser): Promise<StoredUser> {
  // Локальний користувач синхронізується з API перед створенням серверного запису.
  if (!localUser.serverId) {
    return createUserOnServer(localUser);
  }

  try {
    const serverUser = await getUserById(localUser.serverId);
    const shouldUpdate =
      serverUser.fullName !== localUser.fullName ||
      serverUser.email !== localUser.email;

    if (!shouldUpdate) {
      return buildStoredUserFromServer(serverUser);
    }

    const updatedUser = await updateUser(localUser.serverId, buildUserRequestBody(localUser));
    return buildStoredUserFromServer(updatedUser);
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return createUserOnServer({ ...localUser, serverId: null });
    }

    throw error;
  }
}

async function saveUser(): Promise<void> {
  if (!validateUserForm()) {
    return;
  }

  setUserBusy(true);

  let localUser = buildLocalUserPayload();
  let savedOnServer = false;

  try {
    const serverAvailable = await trySwitchToServerMode();

    if (serverAvailable) {
      localUser = await syncUserWithServer(localUser);
      savedOnServer = true;
      await loadAvailableUsers();
    }

    saveStoredUser(localUser);
    fillUserForm(state.currentUser);
    updateUserButton(state.currentUser);
    renderUsers();
    toggleUserPanel(false);
    await refreshItems({ silentSuccess: true, silentError: true });
    setStatus(
      savedOnServer
        ? "Користувача збережено на сервері"
        : "Сервер недоступний, користувача збережено тільки локально",
      savedOnServer ? "success" : "error"
    );
  } catch (error) {
    setStatus(getErrorMessage(error, "Не вдалося зберегти користувача"), "error");
  } finally {
    setUserBusy(false);
  }
}

async function loginUser(): Promise<void> {
  const selectedUserId = elements.loginUserSelect.value;

  if (!selectedUserId) {
    setStatus("Оберіть користувача зі списку, щоб увійти", "error");
    return;
  }

  try {
    const serverUser = await getUserById(selectedUserId);
    saveStoredUser(buildStoredUserFromServer(serverUser));
    fillUserForm(state.currentUser);
    updateUserButton(state.currentUser);
    renderUsers();
    toggleUserPanel(false);
    await refreshItems({ silentSuccess: true, silentError: true });
    setStatus(`Вхід виконано як ${serverUser.fullName}`, "success");
  } catch (error) {
    if (isNetworkOrCorsError(error)) {
      state.mode = "local";
      state.availableUsers = [];
      renderUsers();
      setStatus("Сервер недоступний, увійти в серверного користувача зараз не можна", "error");
      return;
    }

    if (isApiError(error) && error.status === 404) {
      await loadAvailableUsers({ silentError: true });
      setStatus("Цього користувача вже немає на сервері, список оновлено", "error");
      return;
    }

    setStatus(getErrorMessage(error, "Не вдалося виконати вхід"), "error");
  }
}

async function ensureCurrentUser(): Promise<StoredUser> {
  if (!state.currentUser?.fullName || !state.currentUser?.email) {
    throw new Error("Спочатку збережіть користувача або увійдіть");
  }

  const serverAvailable = await trySwitchToServerMode();

  if (!serverAvailable) {
    return state.currentUser;
  }

  const syncedUser = await syncUserWithServer(state.currentUser);
  saveStoredUser(syncedUser);
  updateUserButton(state.currentUser);
  renderUsers();
  return syncedUser;
}

function resetUserState(): void {
  clearStoredUser();
  fillUserForm(state.currentUser);
  updateUserButton(state.currentUser);
  renderUsers();
  toggleUserPanel(false);
}

function logoutCurrentUser(): void {
  if (!state.currentUser) {
    setStatus("Активного користувача немає", "error");
    return;
  }

  // Вихід не видаляє користувача із сервера, а лише прибирає активну сесію в браузері.
  resetUserState();
  resetFormState();
  setStatus("Вихід виконано.", "success");
}

async function removeCurrentUser(): Promise<void> {
  if (!state.currentUser) {
    setStatus("Збереженого користувача немає", "error");
    return;
  }

  const serverId = state.currentUser.serverId;

  setUserBusy(true);

  try {
    const serverAvailable = await trySwitchToServerMode();

    if (serverAvailable && serverId) {
      try {
        await deleteUserById(serverId);
      } catch (error) {
        if (!isNetworkOrCorsError(error) && !(isApiError(error) && error.status === 404)) {
          setStatus(getErrorMessage(error, "Не вдалося видалити користувача"), "error");
          return;
        }
      }
    }

    resetUserState();
    await loadAvailableUsers({ silentError: true });
    await refreshItems({ silentSuccess: true, silentError: true });
    setStatus(serverAvailable ? "Користувача видалено" : "Користувача видалено тільки з localStorage", serverAvailable ? "success" : "error");
  } catch (error) {
    if (!isNetworkOrCorsError(error)) {
      setStatus(getErrorMessage(error, "Не вдалося видалити користувача"), "error");
      return;
    }

    state.mode = "local";
    resetUserState();
    await refreshItems({ silentSuccess: true, silentError: true });
    setStatus("Сервер недоступний, користувача видалено тільки з localStorage", "error");
  } finally {
    setUserBusy(false);
  }
}

function getFilteredLocalItems(): { items: NameWithUserDto[]; total: number } {
  // Локальний fallback повторює ті самі фільтри, сортування і пагінацію, що й API.
  let items = readStoredItems();
  const priority = getPriorityFilter();

  if (priority) {
    items = items.filter(item => item.priority === priority);
  }

  items = [...items].sort((left, right) => {
    const leftDate = new Date(left.createdAt).getTime();
    const rightDate = new Date(right.createdAt).getTime();

    return getSortDirection() === "asc"
      ? leftDate - rightDate
      : rightDate - leftDate;
  });

  const start = (state.page - 1) * state.pageSize;

  return {
    items: items.slice(start, start + state.pageSize),
    total: items.length
  };
}

function renderCurrentTable(): void {
  renderTable(state.items, {
    onDetails: id => {
      void loadDetails(id);
    },
    onEdit: id => {
      void startEdit(id);
    },
    onDelete: id => {
      void deleteItem(id);
    }
  });
  renderPagination(state.page, state.pageSize, state.total, state.mode);
}

async function loadItemsFromServer(): Promise<void> {
  // Основне завантаження списку: loading -> success або empty/error у refreshItems().
  setListStatus("Завантаження...");

  const data = await getNamesWithUsers({
    page: state.page,
    pageSize: state.pageSize,
    sortDir: getSortDirection(),
    priority: getPriorityFilter()
  });

  state.items = data.items;
  state.total = data.total;
  state.page = data.page;
  state.pageSize = data.pageSize;
  state.mode = "server";
  saveStoredItems(data.items);
  renderCurrentTable();
  setListStatus(data.items.length > 0 ? "Дані з сервера завантажено" : "Немає даних", data.items.length > 0 ? "success" : "");
}

function loadItemsFromLocalStorage(): void {
  const data = getFilteredLocalItems();
  state.items = data.items;
  state.total = data.total;
  state.mode = "local";
  renderCurrentTable();
}

async function refreshItems(options: { silentSuccess?: boolean; silentError?: boolean } = {}): Promise<void> {
  // Єдина точка оновлення списку після старту, зміни фільтрів і CRUD-операцій.
  const { silentSuccess = false, silentError = false } = options;

  try {
    await loadItemsFromServer();

    if (!silentSuccess) {
      setStatus("Дані з сервера завантажено", "success");
    }
  } catch (error) {
    if (isNetworkOrCorsError(error)) {
      loadItemsFromLocalStorage();

      if (!silentError) {
        setListStatus("Сервер недоступний, показано localStorage", "error");
        setStatus("Сервер недоступний. Запустіть бекенд і оновіть список.", "error");
      }

      return;
    }

    state.items = [];
    state.total = 0;
    renderCurrentTable();

    if (!silentError) {
      setListStatus(getErrorMessage(error, "Не вдалося отримати записи"), "error");
      setStatus(getErrorMessage(error, "Не вдалося отримати записи"), "error");
    }
  }
}

async function loadDetails(id: Id): Promise<void> {
  // Деталі читаються окремим GET /names/:id, як вимагає лабораторна.
  setDetailsStatus("Завантаження...");

  try {
    const item = state.mode === "server" ? await getNameById(id) : findItemById(id);
    renderDetails(item);
  } catch (error) {
    if (isNetworkOrCorsError(error)) {
      state.mode = "local";
      const localItem = findItemById(id);
      renderDetails(localItem);
      setDetailsStatus(
        localItem
          ? "Сервер недоступний, показано локальну копію"
          : "Сервер недоступний і локальної копії немає",
        localItem ? "success" : "error"
      );
      return;
    }

    renderDetails(null);
    setDetailsStatus(getErrorMessage(error, "Не вдалося завантажити деталі"), "error");
  }
}

async function startEdit(id: Id): Promise<void> {
  try {
    const item = state.mode === "server" ? await getNameById(id) : findItemById(id);

    if (!item) {
      setStatus("Запис не знайдено", "error");
      return;
    }

    state.editId = item.id;
    fillFormForEdit(item);
  } catch (error) {
    if (isNetworkOrCorsError(error)) {
      state.mode = "local";
      const localItem = findItemById(id);

      if (localItem) {
        state.editId = localItem.id;
        fillFormForEdit(localItem);
        setStatus("Сервер недоступний, редагується локальна копія", "error");
        return;
      }
    }

    setStatus(getErrorMessage(error, "Не вдалося відкрити редагування"), "error");
  }
}

function buildLocalItem(formData: ValidNameFormDto, user: StoredUser | null): NameWithUserDto {
  // Локальний запис має той самий DTO-формат, що й JOIN-відповідь сервера.
  const existingItem = findItemById(state.editId);
  const ownerId = existingItem?.userId ?? user?.localId;
  const ownerName = existingItem?.userFullName ?? user?.fullName ?? "Локальний користувач";
  const ownerEmail = existingItem?.userEmail ?? user?.email ?? "";

  if (!ownerId) {
    throw new Error("Спочатку збережіть користувача або увійдіть під існуючим");
  }

  return {
    id: state.editId ?? `local-item-${Date.now()}`,
    userId: ownerId,
    title: formData.title,
    teacher: formData.teacher,
    course: formData.course,
    priority: formData.priority,
    note: formData.note,
    userFullName: ownerName,
    userEmail: ownerEmail,
    createdAt: existingItem?.createdAt ?? new Date().toISOString()
  };
}

async function submitServerItem(formData: ValidNameFormDto, user: StoredUser | null): Promise<void> {
  // Для редагування і створення використовується той самий узгоджений DTO.
  const existingItem = findItemById(state.editId);
  const ownerId = existingItem?.userId ?? user?.serverId;

  if (!ownerId) {
    throw new Error("Спочатку збережіть користувача або увійдіть під існуючим");
  }

  const payload: CreateNameRequestDto = {
    userId: ownerId,
    title: formData.title,
    teacher: formData.teacher,
    course: formData.course,
    priority: formData.priority,
    note: formData.note
  };

  if (state.editId) {
    await updateName(state.editId, payload);
    return;
  }

  await createName(payload);
}

function submitLocalItem(formData: ValidNameFormDto, user: StoredUser | null): void {
  const items = readStoredItems();
  const nextItem = buildLocalItem(formData, user);
  const nextItems = state.editId
    ? items.map(item => (item.id === state.editId ? nextItem : item))
    : [nextItem, ...items];

  saveStoredItems(nextItems);
}

async function submitForm(event: SubmitEvent): Promise<void> {
  // submit проходить клієнтську валідацію, потім пробує сервер і лише при мережевому збої падає в localStorage.
  event.preventDefault();

  const data = readForm();

  if (!validateForm(data)) {
    return;
  }

  setFormBusy(true);

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
        if (!isNetworkOrCorsError(error)) {
          if (isApiError(error)) {
            applyBackendErrors(error);
          }

          setStatus(getErrorMessage(error, "Не вдалося зберегти запис"), "error");
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

    resetFormState();
    await refreshItems({ silentSuccess: true, silentError: true });
  } catch (error) {
    setStatus(getErrorMessage(error, "Не вдалося зберегти запис"), "error");
  } finally {
    setFormBusy(false);
  }
}

async function deleteItem(id: Id): Promise<void> {

  try {
    if (state.mode === "server") {
      try {
        await deleteName(id);
        setStatus("Запис видалено з сервера", "success");
      } catch (error) {
        if (!isNetworkOrCorsError(error)) {
          setStatus(getErrorMessage(error, "Не вдалося видалити запис"), "error");
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
      resetFormState();
    }

    await refreshItems({ silentSuccess: true, silentError: true });
  } catch (error) {
    setStatus(getErrorMessage(error, "Не вдалося видалити запис"), "error");
  }
}

function changePage(delta: number): void {
  // Зміна сторінки не міняє фільтри, лише перезавантажує поточний список.
  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
  state.page = Math.min(totalPages, Math.max(1, state.page + delta));
  void refreshItems({ silentSuccess: true, silentError: false });
}

async function initialize(): Promise<void> {
  // Початкове завантаження: користувачі, список і пустий блок деталей.
  fillUserForm(state.currentUser);
  updateUserButton(state.currentUser);
  renderUsers();
  renderDetails(null);
  await loadAvailableUsers({ silentError: true });
  await refreshItems({ silentSuccess: true, silentError: false });
}

elements.nameInput.addEventListener("input", () => {
  sanitizeTextInput(elements.nameInput, elements.errors.title, "Назва не може містити цифри");
});

elements.teacherInput.addEventListener("input", () => {
  sanitizeTextInput(
    elements.teacherInput,
    elements.errors.teacher,
    "Ім'я викладача не може містити цифри"
  );
});

elements.userToggleBtn.addEventListener("click", () => {
  fillUserForm(state.currentUser);
  toggleUserPanel();

  if (!elements.userPanel.classList.contains("hidden")) {
    void loadAvailableUsers({ silentError: true });
  }
});

elements.closeUserBtn.addEventListener("click", () => {
  toggleUserPanel(false);
});

elements.saveUserBtn.addEventListener("click", () => {
  void saveUser();
});

elements.loginUserBtn.addEventListener("click", () => {
  void loginUser();
});

elements.logoutUserBtn.addEventListener("click", logoutCurrentUser);

elements.deleteUserBtn.addEventListener("click", () => {
  void removeCurrentUser();
});

elements.form.addEventListener("submit", event => {
  void submitForm(event);
});

elements.resetBtn.addEventListener("click", resetFormState);
elements.prevPageBtn.addEventListener("click", () => changePage(-1));
elements.nextPageBtn.addEventListener("click", () => changePage(1));
elements.closeDetailsBtn.addEventListener("click", () => renderDetails(null));

elements.sortDate.addEventListener("change", () => {
  state.page = 1;
  void refreshItems({ silentSuccess: true, silentError: false });
});

elements.filterPriority.addEventListener("change", () => {
  state.page = 1;
  void refreshItems({ silentSuccess: true, silentError: false });
});

void initialize();
