import { randomUUID } from "node:crypto";
import type {
  CreateNoteRequestDto,
  NoteDto,
  NotesQueryDto,
  PatchNoteRequestDto,
  UpdateNoteRequestDto
} from "../dtos/notes.dtos";
import type { NotesRepository } from "../repositories/notes.repository";
import type { NamesRepository } from "../repositories/names.repository";
import type { UsersRepository } from "../repositories/users.repository";
import { ApiError } from "../middleware/error-handler.middleware";

interface NotesService {
  getList(query: NotesQueryDto, currentUserId: string): {
    items: NoteDto[];
    total: number;
    page: number;
    pageSize: number;
  };
  getById(id: string, currentUserId: string): NoteDto;
  create(data: CreateNoteRequestDto, currentUserId: string): NoteDto;
  update(id: string, data: UpdateNoteRequestDto, currentUserId: string): NoteDto;
  patch(id: string, data: PatchNoteRequestDto, currentUserId: string): NoteDto;
  delete(id: string, currentUserId: string): void;
}

export function createNotesService(
  repository: NotesRepository,
  usersRepository: UsersRepository,
  namesRepository: NamesRepository
): NotesService {
  function ensureUserExists(userId: string): void {
    // We validate the user reference before writing so the API returns a clean 400.
    if (!usersRepository.findById(userId)) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid request body", [
        {
          field: "userId",
          message: "Користувача з таким id не знайдено"
        }
      ]);
    }
  }

  function syncNotesFromNames(): void {
    // Frontend creates comments through names, so notes mirrors them for read-only access here.
    namesRepository.findAllAsNotes().forEach(note => {
      repository.upsert({
        id: note.id,
        userId: note.userId,
        content: note.content,
        createdAt: note.createdAt
      });
    });
  }

  function ensureNoteIsNotManagedByNames(id: string): void {
    if (namesRepository.findById(id)) {
      throw new ApiError(
        409,
        "CONFLICT",
        "Note is synchronized from /api/names and should be changed there"
      );
    }
  }

  return {
    getList(query, currentUserId) {
      syncNotesFromNames();

      return {
        items: repository.findList(query, currentUserId),
        total: repository.count(query, currentUserId),
        page: query.page,
        pageSize: query.pageSize
      };
    },

    getById(id, currentUserId) {
      syncNotesFromNames();

      const item = repository.findByIdForUser(id, currentUserId);

      if (!item) {
        throw new ApiError(404, "NOT_FOUND", "Note not found");
      }

      return item;
    },

    create(data, currentUserId) {
      // Власника задає серверний контекст, а не body клієнта.
      ensureUserExists(currentUserId);

      const item: NoteDto = {
        id: randomUUID(),
        userId: currentUserId,
        content: data.content,
        createdAt: new Date().toISOString()
      };

      repository.create(item);
      return item;
    },

    update(id, data, currentUserId) {
      const existingItem = this.getById(id, currentUserId);
      ensureNoteIsNotManagedByNames(id);

      const item: NoteDto = {
        id: existingItem.id,
        userId: currentUserId,
        content: data.content,
        createdAt: existingItem.createdAt
      };

      repository.updateForUser(id, currentUserId, item);
      return item;
    },

    patch(id, data, currentUserId) {
      // PATCH змінює тільки передані поля, але лише після перевірки власника.
      const existingItem = this.getById(id, currentUserId);
      ensureNoteIsNotManagedByNames(id);

      const item: NoteDto = {
        id: existingItem.id,
        userId: currentUserId,
        content: data.content ?? existingItem.content,
        createdAt: existingItem.createdAt
      };

      repository.updateForUser(id, currentUserId, item);
      return item;
    },

    delete(id, currentUserId) {
      this.getById(id, currentUserId);
      ensureNoteIsNotManagedByNames(id);

      if (!repository.deleteForUser(id, currentUserId)) {
        throw new ApiError(404, "NOT_FOUND", "Note not found");
      }
    }
  };
}

export type { NotesService };
