import { randomUUID } from "node:crypto";
import type {
  CreateUserRequestDto,
  PatchUserRequestDto,
  UpdateUserRequestDto,
  UserDto,
  UsersQueryDto
} from "../dtos/users.dtos";
import type { UsersRepository } from "../repositories/users.repository";
import { ApiError } from "../middleware/error-handler.middleware";

interface UsersService {
  getList(query: UsersQueryDto): {
    items: UserDto[];
    total: number;
    page: number;
    pageSize: number;
  };
  getById(id: string): UserDto;
  create(data: CreateUserRequestDto): UserDto;
  update(id: string, data: UpdateUserRequestDto): UserDto;
  patch(id: string, data: PatchUserRequestDto): UserDto;
  delete(id: string): void;
}

export function createUsersService(
  repository: UsersRepository
): UsersService {
  return {
    getList(query) {
      // Service adds pagination metadata around repository results.
      return {
        items: repository.findList(query),
        total: repository.count(query),
        page: query.page,
        pageSize: query.pageSize
      };
    },

    getById(id) {
      const item = repository.findById(id);

      // Missing ids are converted to a stable API 404 response here.
      if (!item) {
        throw new ApiError(404, "NOT_FOUND", "User not found");
      }

      return item;
    },

    create(data) {
      // UUID and timestamps are owned by the backend, not the client.
      const item: UserDto = {
        id: randomUUID(),
        fullName: data.fullName,
        email: data.email,
        createdAt: new Date().toISOString()
      };

      repository.create(item);
      return item;
    },

    update(id, data) {
      const existingItem = this.getById(id);

      const item: UserDto = {
        id: existingItem.id,
        fullName: data.fullName,
        email: data.email,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    patch(id, data) {
      // PATCH keeps old values for fields that were not sent.
      const existingItem = this.getById(id);

      const item: UserDto = {
        id: existingItem.id,
        fullName: data.fullName ?? existingItem.fullName,
        email: data.email ?? existingItem.email,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    delete(id) {
      if (!repository.findById(id)) {
        throw new ApiError(404, "NOT_FOUND", "User not found");
      }

      // Actual cascade effects are enforced by SQLite foreign keys.
      repository.delete(id);
    }
  };
}

export type { UsersService };
