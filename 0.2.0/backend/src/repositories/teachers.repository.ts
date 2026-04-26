import type { TeacherDto } from "../dtos/teachers.dtos";

interface TeachersRepository {
  findAll(): TeacherDto[];
  findById(id: string): TeacherDto | undefined;
  create(item: TeacherDto): TeacherDto;
  update(id: string, item: TeacherDto): TeacherDto;
  delete(id: string): boolean;
}

export function createTeachersRepository(): TeachersRepository {
  const items = new Map<string, TeacherDto>();

  return {
    findAll() {
      return [...items.values()];
    },
    findById(id) {
      return items.get(id);
    },
    create(item) {
      items.set(item.id, item);
      return item;
    },
    update(id, item) {
      items.set(id, item);
      return item;
    },
    delete(id) {
      return items.delete(id);
    }
  };
}

export type { TeachersRepository };
