import { randomUUID } from "node:crypto";
import type {
  CreateNoteRequestDto,
  NoteDto,
  NotesQueryDto,
  PatchNoteRequestDto,
  UpdateNoteRequestDto
} from "../dtos/notes.dtos";
import type { NotesRepository } from "../repositories/notes.repository";
import type { UsersRepository } from "../repositories/users.repository";
import { ApiError } from "../middleware/error-handler.middleware";

interface NotesService {
  getList(query: NotesQueryDto): {
    items: NoteDto[];
    total: number;
    page: number;
    pageSize: number;
  };
  getById(id: string): NoteDto;
  create(data: CreateNoteRequestDto): NoteDto;
  update(id: string, data: UpdateNoteRequestDto): NoteDto;
  patch(id: string, data: PatchNoteRequestDto): NoteDto;
  delete(id: string): void;
}

export function createNotesService(
  repository: NotesRepository,
  usersRepository: UsersRepository
): NotesService {
  function ensureUserExists(userId: string): void {                           // Нотатка прив'язується до існуючого користувача
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
      let items = repository.findAll();                                 // Фільтрація списку нотаток за користувачем і категорією

      if (query.userId) {
        items = items.filter(item => item.userId === query.userId);
      }

      if (query.category) {
        items = items.filter(item => item.category === query.category);
      }

      items = [...items].sort((left, right) => {                           // Сортування списку за датою створення
        const leftDate = new Date(left.createdAt).getTime();
        const rightDate = new Date(right.createdAt).getTime();

        return query.sortDir === "asc"
          ? leftDate - rightDate
          : rightDate - leftDate;
      });

      const total = items.length;
      const startIndex = (query.page - 1) * query.pageSize;

      return {                                                           // Пагінація для GET /api/notes
        items: items.slice(startIndex, startIndex + query.pageSize),
        total,
        page: query.page,
        pageSize: query.pageSize
      };
    },

    getById(id) {                                                   // Пошук по id завершується 404, якщо нотатку не знайдено
      const item = repository.findById(id);

      if (!item) {
        throw new ApiError(404, "NOT_FOUND", "Note not found");
      }

      return item;
    },

    create(data) {
      ensureUserExists(data.userId);

      const item: NoteDto = {
        id: randomUUID(),
        userId: data.userId,
        content: data.content,
        category: data.category,
        createdAt: new Date().toISOString()
      };

      repository.create(item);
      return item;
    },

    update(id, data) {
      const existingItem = this.getById(id);
      ensureUserExists(data.userId);

      const item: NoteDto = {
        id: existingItem.id,
        userId: data.userId,
        content: data.content,
        category: data.category,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    patch(id, data) {
      const existingItem = this.getById(id);
      const userId = data.userId ?? existingItem.userId;

      ensureUserExists(userId);

      const item: NoteDto = {                                  // Часткове оновлення, бере старі значення для полів, яких нема в тілі
        id: existingItem.id,
        userId,
        content: data.content ?? existingItem.content,
        category: data.category ?? existingItem.category,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    delete(id) {
      if (!repository.findById(id)) {
        throw new ApiError(404, "NOT_FOUND", "Note not found");
      }

      repository.delete(id);
    }
  };
}

export type { NotesService };
