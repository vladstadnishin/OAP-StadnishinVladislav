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
      let items = repository.findAll();

      if (query.search) {                                                       // Пошук користувачів за ім'ям або email
        const searchText = query.search.toLowerCase();

        items = items.filter(item =>
          `${item.fullName} ${item.email}`.toLowerCase().includes(searchText)
        );
      }

      items = [...items].sort((left, right) => {
        const leftDate = new Date(left.createdAt).getTime();
        const rightDate = new Date(right.createdAt).getTime();

        return query.sortDir === "asc"
          ? leftDate - rightDate
          : rightDate - leftDate;
      });

      const total = items.length;
      const startIndex = (query.page - 1) * query.pageSize;

      return {                                                                  // Повертаємо список, метадані пагінації
        items: items.slice(startIndex, startIndex + query.pageSize),
        total,
        page: query.page,
        pageSize: query.pageSize
      };
    },

    getById(id) {                                                     //Єдиний формат помилки для відсутнього користувача
      const item = repository.findById(id);

      if (!item) {
        throw new ApiError(404, "NOT_FOUND", "User not found");
      }

      return item;
    },

    create(data) {
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

      repository.delete(id);
    }
  };
}

export type { UsersService };
