import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "./config.js";
import type {
  ApiErrorDto,
  CreateNameRequestDto,
  CreateUserRequestDto,
  Id,
  NameDto,
  NameWithUserDto,
  PaginatedResponseDto,
  Priority,
  SortDirection,
  UpdateNameRequestDto,
  UpdateUserRequestDto,
  UserDto
} from "./dtos.js";

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

interface ListQuery {
  page: number;
  pageSize: number;
  sortDir: SortDirection;
  priority?: Priority;
}

interface UsersQuery {
  page: number;
  pageSize: number;
  sortDir: SortDirection;
}

interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

function normalizeDetails(details: unknown): ApiErrorDto["details"] {
  // Бекенд повертає details як масив, але клієнт усе одно перевіряє форму,
  // щоб не впасти від неочікуваної відповіді або HTML-сторінки помилки.
  if (!Array.isArray(details)) {
    return [];
  }

  return details
    .filter((detail): detail is { field?: unknown; message?: unknown } => {
      return typeof detail === "object" && detail !== null && "message" in detail;
    })
    .map(detail => ({
      field: typeof detail.field === "string" ? detail.field : undefined,
      message: typeof detail.message === "string" ? detail.message : String(detail.message)
    }));
}

function parseErrorPayload(status: number, rawText: string): ApiErrorDto {
  let payload: ApiErrorPayload | null = null;

  // Тіло помилки може бути JSON або звичайним текстом, тому JSON парситься обережно.
  try {
    payload = rawText ? (JSON.parse(rawText) as ApiErrorPayload) : null;
  } catch {
    payload = null;
  }

  const source = payload?.error ?? payload;

  return {
    status,
    code: source?.code ?? `HTTP_${status}`,
    message: source?.message ?? "HTTP помилка",
    details: normalizeDetails(source?.details ?? rawText)
  };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const headers = new Headers(options.headers);

  // Для POST/PUT JSON-запитів Content-Type виставляється в одному місці.
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    if (response.status === 204) {
      return null as T;
    }

    const rawText = await response.text();

    if (response.ok) {
      if (!rawText) {
        return null as T;
      }

      try {
        return JSON.parse(rawText) as T;
      } catch {
        return rawText as T;
      }
    }

    throw parseErrorPayload(response.status, rawText);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      // AbortController дає контрольований timeout замість нескінченного очікування.
      throw {
        status: 0,
        code: "REQUEST_TIMEOUT",
        message: "Запит перевищив ліміт часу. Перевірте, чи запущений бекенд.",
        details: []
      } satisfies ApiErrorDto;
    }

    if (typeof error === "object" && error !== null && "status" in error) {
      throw error;
    }

    throw {
      status: 0,
      code: "NETWORK_OR_CORS_ERROR",
      message: "Помилка мережі або CORS. Перевірте запуск сервера та origin фронтенду.",
      details: [
        {
          message: error instanceof Error ? error.message : String(error)
        }
      ]
    } satisfies ApiErrorDto;
  } finally {
    window.clearTimeout(timeout);
  }
}

function buildQuery(params: object): string {
  const query = new URLSearchParams();

  // Порожні значення не додаються в URL, щоб не ламати строгі query DTO бекенду.
  Object.entries(params).forEach(([key, value]) => {
    if ((typeof value === "string" || typeof value === "number") && value !== "") {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();

  return serialized ? `?${serialized}` : "";
}

export async function getNamesWithUsers(
  query: ListQuery
): Promise<PaginatedResponseDto<NameWithUserDto>> {
  // Основний список використовує JOIN endpoint, щоб у таблиці одразу були дані користувача.
  return request<PaginatedResponseDto<NameWithUserDto>>(
    `/names/with-users${buildQuery(query)}`
  );
}

export async function getNameById(id: Id): Promise<NameDto> {
  return request<NameDto>(`/names/${id}`);
}

export async function createName(payload: CreateNameRequestDto): Promise<NameDto> {
  return request<NameDto>("/names", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateName(id: Id, payload: UpdateNameRequestDto): Promise<NameDto> {
  return request<NameDto>(`/names/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteName(id: Id): Promise<void> {
  await request<void>(`/names/${id}`, {
    method: "DELETE"
  });
}

export async function getUsers(query: UsersQuery): Promise<PaginatedResponseDto<UserDto>> {
  return request<PaginatedResponseDto<UserDto>>(`/users${buildQuery(query)}`);
}

export async function getUserById(id: Id): Promise<UserDto> {
  return request<UserDto>(`/users/${id}`);
}

export async function createUser(payload: CreateUserRequestDto): Promise<UserDto> {
  return request<UserDto>("/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateUser(id: Id, payload: UpdateUserRequestDto): Promise<UserDto> {
  return request<UserDto>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteUserById(id: Id): Promise<void> {
  await request<void>(`/users/${id}`, {
    method: "DELETE"
  });
}
