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
    getList(query) {
      syncNotesFromNames();

      return {
        items: repository.findList(query),
        total: repository.count(query),
        page: query.page,
        pageSize: query.pageSize
      };
    },

    getById(id) {
      syncNotesFromNames();

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
        createdAt: new Date().toISOString()
      };

      repository.create(item);
      return item;
    },

    update(id, data) {
      ensureNoteIsNotManagedByNames(id);

      const existingItem = this.getById(id);
      ensureUserExists(data.userId);

      const item: NoteDto = {
        id: existingItem.id,
        userId: data.userId,
        content: data.content,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    patch(id, data) {
      // Same PATCH idea as in the other services: merge incoming fields with stored values.
      ensureNoteIsNotManagedByNames(id);

      const existingItem = this.getById(id);
      const userId = data.userId ?? existingItem.userId;

      ensureUserExists(userId);

      const item: NoteDto = {
        id: existingItem.id,
        userId,
        content: data.content ?? existingItem.content,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    delete(id) {
      ensureNoteIsNotManagedByNames(id);

      if (!repository.findById(id)) {
        throw new ApiError(404, "NOT_FOUND", "Note not found");
      }

      repository.delete(id);
    }
  };
}

export type { NotesService };
