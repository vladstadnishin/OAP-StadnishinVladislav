import { randomUUID } from "node:crypto";
import type {
  CreateTeacherRequestDto,
  PatchTeacherRequestDto,
  TeacherDto,
  TeachersQueryDto,
  UpdateTeacherRequestDto
} from "../dtos/teachers.dtos";
import type { TeachersRepository } from "../repositories/teachers.repository";
import { ApiError } from "../middleware/error-handler.middleware";

interface TeachersService {
  getList(query: TeachersQueryDto): {
    items: TeacherDto[];
    total: number;
    page: number;
    pageSize: number;
  };
  getById(id: string): TeacherDto;
  create(data: CreateTeacherRequestDto): TeacherDto;
  update(id: string, data: UpdateTeacherRequestDto): TeacherDto;
  patch(id: string, data: PatchTeacherRequestDto): TeacherDto;
  delete(id: string): void;
}

export function createTeachersService(
  repository: TeachersRepository
): TeachersService {
  return {
    getList(query) {
      let items = repository.findAll();

      if (query.department) {
        const department = query.department.toLowerCase();

        items = items.filter(
          item => item.department.toLowerCase() === department
        );
      }

      if (query.search) {
        const searchText = query.search.toLowerCase();

        items = items.filter(item =>
          `${item.fullName} ${item.email} ${item.department}`
            .toLowerCase()
            .includes(searchText)
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

      return {
        items: items.slice(startIndex, startIndex + query.pageSize),
        total,
        page: query.page,
        pageSize: query.pageSize
      };
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
        email: data.email,
        department: data.department,
        createdAt: new Date().toISOString()
      };

      repository.create(item);
      return item;
    },

    update(id, data) {
      const existingItem = this.getById(id);

      const item: TeacherDto = {
        id: existingItem.id,
        fullName: data.fullName,
        email: data.email,
        department: data.department,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    patch(id, data) {
      const existingItem = this.getById(id);

      const item: TeacherDto = {
        id: existingItem.id,
        fullName: data.fullName ?? existingItem.fullName,
        email: data.email ?? existingItem.email,
        department: data.department ?? existingItem.department,
        createdAt: existingItem.createdAt
      };

      repository.update(id, item);
      return item;
    },

    delete(id) {
      if (!repository.findById(id)) {
        throw new ApiError(404, "NOT_FOUND", "Teacher not found");
      }

      repository.delete(id);
    }
  };
}

export type { TeachersService };
