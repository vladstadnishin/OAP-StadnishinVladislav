import { randomUUID } from "node:crypto";
import type {
  CreateNameRequestDto,
  NameDto,
  NamesQueryDto,
  PatchNameRequestDto,
  UpdateNameRequestDto
} from "../dtos/names.dtos";
import type { NamesRepository } from "../repositories/names.repository";
import type { UsersRepository } from "../repositories/users.repository";
import { ApiError } from "../middleware/error-handler.middleware";

interface NamesService {
  getList(query: NamesQueryDto): {
    items: NameDto[];
    total: number;
    page: number;
    pageSize: number;
  };
  getById(id: string): NameDto;
  create(data: CreateNameRequestDto): NameDto;
  update(id: string, data: UpdateNameRequestDto): NameDto;
  patch(id: string, data: PatchNameRequestDto): NameDto;
  delete(id: string): void;
}

export function createNamesService(
  repository: NamesRepository,
  usersRepository: UsersRepository
): NamesService {                                                // Перед створенням або оновленням перевірка, що прив'язаний користувач існує
  function ensureUserExists(userId: string): void {
    if (!usersRepository.findById(userId)) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid request body", [
        {
          field: "userId",
          message: "Користувача з таким id не знайдено"
        }
      ]);
    }
  }

  return {
    getList(query) {
      let items = repository.findAll();                                       // Фільтрація списку через query params
      if (query.priority) {
        items = items.filter(item => item.priority === query.priority);
      }

      if (query.userId) {
        items = items.filter(item => item.userId === query.userId);
      }

      items = [...items].sort((left, right) => {                        // Сортування списку за датою створення
        const leftDate = new Date(left.createdAt).getTime();
        const rightDate = new Date(right.createdAt).getTime();

        return query.sortDir === "asc"
          ? leftDate - rightDate
          : rightDate - leftDate;
      });

      const total = items.length;
      const startIndex = (query.page - 1) * query.pageSize;

      return {                                                           // Пагінація, повертає лише потрібний зріз масиву
        items: items.slice(startIndex, startIndex + query.pageSize),
        total,
        page: query.page,
        pageSize: query.pageSize
      };
    },

    getById(id) {
      const item = repository.findById(id);

      if (!item) {                                                   // Єдиний формат 404 для відсутнього ресурсу
        throw new ApiError(404, "NOT_FOUND", "Name not found");
      }

      return item;
    },

    create(data) {
      ensureUserExists(data.userId);

      const item: NameDto = {
        id: randomUUID(),
        userId: data.userId,
        title: data.title,
        teacher: data.teacher,
        course: data.course,
        priority: data.priority,
        note: data.note,
        createdAt: new Date().toISOString()
      };

      repository.create(item);
      return item;
    },

    update(id, data) {
      const existingItem = this.getById(id);
      ensureUserExists(data.userId);

      const item: NameDto = {                       // PUT повністю замінює змінювані поля, але зберігає id і createdAt
        id: existingItem.id,
        userId: data.userId,
        title: data.title,
        teacher: data.teacher,
        course: data.course,
        priority: data.priority,
        note: data.note,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    patch(id, data) {
      const existingItem = this.getById(id);
      const userId = data.userId ?? existingItem.userId;

      ensureUserExists(userId);

      const item: NameDto = {                                  // PATCH оновлює лише ті поля, які прийшли в запиті.
        id: existingItem.id,
        userId,
        title: data.title ?? existingItem.title,
        teacher: data.teacher ?? existingItem.teacher,
        course: data.course ?? existingItem.course,
        priority: data.priority ?? existingItem.priority,
        note: data.note ?? existingItem.note,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    delete(id) {                                                 // Видалення повертає 404, якщо запису не існує.
      if (!repository.findById(id)) {
        throw new ApiError(404, "NOT_FOUND", "Name not found");
      }

      repository.delete(id);
    }
  };
}

export type { NamesService };
