import { randomUUID } from "node:crypto";
import type {
  CreateNameRequestDto,
  NameDto,
  NamePriorityStatDto,
  NameWithUserDto,
  NamesQueryDto,
  NamesStatsQueryDto,
  PatchNameRequestDto,
  UpdateNameRequestDto
} from "../dtos/names.dtos";
import type { NamesRepository } from "../repositories/names.repository";
import type { NotesRepository } from "../repositories/notes.repository";
import type { TeachersRepository } from "../repositories/teachers.repository";
import type { UsersRepository } from "../repositories/users.repository";
import { ApiError } from "../middleware/error-handler.middleware";

interface NamesService {
  getList(query: NamesQueryDto): {
    items: NameDto[];
    total: number;
    page: number;
    pageSize: number;
  };
  getWithUsers(query: NamesQueryDto): {
    items: NameWithUserDto[];
    total: number;
    page: number;
    pageSize: number;
  };
  getPriorityStats(query: NamesStatsQueryDto): {
    items: NamePriorityStatDto[];
    total: number;
  };
  getById(id: string): NameDto;
  create(data: CreateNameRequestDto): NameDto;
  update(id: string, data: UpdateNameRequestDto): NameDto;
  patch(id: string, data: PatchNameRequestDto): NameDto;
  delete(id: string): void;
}

export function createNamesService(
  repository: NamesRepository,
  usersRepository: UsersRepository,
  teachersRepository: TeachersRepository,
  notesRepository: NotesRepository
): NamesService {
  function ensureUserExists(userId: string): void {
    // The service performs an explicit FK-friendly check before INSERT/UPDATE.
    if (!usersRepository.findById(userId)) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid request body", [
        {
          field: "userId",
          message: "Користувача з таким id не знайдено"
        }
      ]);
    }
  }

  function ensureTeacherExists(fullName: string, createdAt: string): void {
    if (teachersRepository.findByFullName(fullName)) {
      return;
    }

    // Teacher rows are auto-created from the main name form so /api/teachers stays in sync.
    teachersRepository.create({
      id: randomUUID(),
      fullName,
      createdAt
    });
  }

  function syncNoteFromName(item: NameDto): void {
    notesRepository.upsert({
      id: item.id,
      userId: item.userId,
      content: item.note,
      createdAt: item.createdAt
    });
  }

  return {
    getList(query) {
      // Main paginated list used by the frontend table.
      return {
        items: repository.findList(query),
        total: repository.count(query),
        page: query.page,
        pageSize: query.pageSize
      };
    },

    getWithUsers(query) {
      // JOIN endpoint used to demonstrate linked data in one response.
      return {
        items: repository.findWithUsers(query),
        total: repository.count(query),
        page: query.page,
        pageSize: query.pageSize
      };
    },

    getPriorityStats(query) {
      // Aggregation endpoint required for the "excellent" level in the lab.
      const items = repository.getPriorityStats(query);

      return {
        items,
        total: items.reduce((sum, item) => sum + item.total, 0)
      };
    },

    getById(id) {
      const item = repository.findById(id);

      if (!item) {
        throw new ApiError(404, "NOT_FOUND", "Name not found");
      }

      return item;
    },

    create(data) {
      ensureUserExists(data.userId);

      // Backend creates id/createdAt so the client cannot spoof server metadata.
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
      ensureTeacherExists(item.teacher, item.createdAt);
      syncNoteFromName(item);
      return item;
    },

    update(id, data) {
      // PUT replaces all mutable fields while preserving id/createdAt.
      const existingItem = this.getById(id);
      ensureUserExists(data.userId);

      const item: NameDto = {
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
      ensureTeacherExists(item.teacher, item.createdAt);
      syncNoteFromName(item);
      return item;
    },

    patch(id, data) {
      // PATCH only changes the fields that arrived in the request body.
      const existingItem = this.getById(id);
      const userId = data.userId ?? existingItem.userId;

      ensureUserExists(userId);

      const item: NameDto = {
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
      ensureTeacherExists(item.teacher, item.createdAt);
      syncNoteFromName(item);
      return item;
    },

    delete(id) {
      if (!repository.findById(id)) {
        throw new ApiError(404, "NOT_FOUND", "Name not found");
      }

      repository.delete(id);
      notesRepository.delete(id);
    }
  };
}

export type { NamesService };
