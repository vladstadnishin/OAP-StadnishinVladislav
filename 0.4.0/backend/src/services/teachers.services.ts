import { randomUUID } from "node:crypto";
import type {
  CreateTeacherRequestDto,
  PatchTeacherRequestDto,
  TeacherDto,
  TeachersQueryDto,
  UpdateTeacherRequestDto
} from "../dtos/teachers.dtos";
import type { TeachersRepository } from "../repositories/teachers.repository";
import type { NamesRepository } from "../repositories/names.repository";
import { ApiError } from "../middleware/error-handler.middleware";

interface TeachersService {
  getList(query: TeachersQueryDto): {
    items: TeacherDto[];
    total: number;
    page: number;
    pageSize: number;
  };
  unsafeSearch(search: string): TeacherDto[];
  getById(id: string): TeacherDto;
  create(data: CreateTeacherRequestDto): TeacherDto;
  update(id: string, data: UpdateTeacherRequestDto): TeacherDto;
  patch(id: string, data: PatchTeacherRequestDto): TeacherDto;
  delete(id: string): void;
}

export function createTeachersService(
  repository: TeachersRepository,
  namesRepository: NamesRepository
): TeachersService {
  function syncTeachersFromNames(): void {
    const teacherNames = namesRepository.findDistinctTeacherNames();

    teacherNames.forEach(fullName => {
      if (repository.findByFullName(fullName)) {
        return;
      }

      // Names are sometimes created from the student form only, so we generate a minimal teacher record for API consistency.
      repository.create({
        id: randomUUID(),
        fullName,
        createdAt: new Date().toISOString()
      });
    });
  }

  return {
    getList(query) {
      // Before reading teachers, sync missing teacher rows from the names table.
      syncTeachersFromNames();

      return {
        items: repository.findList(query),
        total: repository.count(query),
        page: query.page,
        pageSize: query.pageSize
      };
    },

    unsafeSearch(search) {
      syncTeachersFromNames();

      // This service method exposes the intentionally unsafe repository query as-is.
      return repository.unsafeSearch(search);
    },

    getById(id) {
      const item = repository.findById(id);

      if (!item) {
        throw new ApiError(404, "NOT_FOUND", "Teacher not found");
      }

      return item;
    },

    create(data) {
      const item: TeacherDto = {
        id: randomUUID(),
        fullName: data.fullName,
        createdAt: new Date().toISOString()
      };

      repository.create(item);
      return item;
    },

    update(id, data) {
      const existingItem = this.getById(id);

      // If a teacher name is already used inside names, it must be edited through that main entity.
      if (namesRepository.hasTeacherName(existingItem.fullName)) {
        throw new ApiError(
          409,
          "CONFLICT",
          "Teacher is synchronized from /api/names and cannot be changed here"
        );
      }

      const item: TeacherDto = {
        id: existingItem.id,
        fullName: data.fullName,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    patch(id, data) {
      // Partial update is built here so the repository still gets a full DTO.
      const existingItem = this.getById(id);

      if (namesRepository.hasTeacherName(existingItem.fullName)) {
        throw new ApiError(
          409,
          "CONFLICT",
          "Teacher is synchronized from /api/names and cannot be changed here"
        );
      }

      const item: TeacherDto = {
        id: existingItem.id,
        fullName: data.fullName ?? existingItem.fullName,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    delete(id) {
      const existingItem = repository.findById(id);

      if (!existingItem) {
        throw new ApiError(404, "NOT_FOUND", "Teacher not found");
      }

      if (namesRepository.hasTeacherName(existingItem.fullName)) {
        throw new ApiError(
          409,
          "CONFLICT",
          "Teacher is synchronized from /api/names and cannot be deleted here"
        );
      }

      repository.delete(id);
    }
  };
}

export type { TeachersService };
