// DTO описують контракт між фронтендом і бекендом.
// Якщо бекенд змінить формат відповіді, TypeScript підсвітить місця,
// де фронтенд очікує стару структуру.
export type Id = string;
export type SortDirection = "asc" | "desc";
export type Priority = "Низький" | "Середній" | "Високий";
export type Course = "1" | "2" | "3" | "4" | "5" | "6";
export type UiMode = "server" | "local";

export interface ErrorDetailDto {
  field?: string;
  message: string;
}

export interface ApiErrorDto {
  status: number;
  code: string;
  message: string;
  details: ErrorDetailDto[];
}

export interface PaginatedResponseDto<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserDto {
  id: Id;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface StoredUser {
  localId: Id;
  serverId: Id | null;
  fullName: string;
  email: string;
}

export interface NameDto {
  id: Id;
  userId: Id;
  title: string;
  teacher: string;
  course: Course;
  priority: Priority;
  note: string;
  createdAt: string;
}

export interface NameWithUserDto extends NameDto {
  userFullName: string;
  userEmail: string;
}

export interface LocalNameDto extends NameDto {
  userFullName: string;
  userEmail: string;
}

export interface NameFormDto {
  title: string;
  teacher: string;
  course: Course | "";
  priority: Priority | "";
  note: string;
}

export interface CreateNameRequestDto {
  userId: Id;
  title: string;
  teacher: string;
  course: Course;
  priority: Priority;
  note: string;
}

export type UpdateNameRequestDto = CreateNameRequestDto;

export interface CreateUserRequestDto {
  fullName: string;
  email: string;
}

export type UpdateUserRequestDto = CreateUserRequestDto;
