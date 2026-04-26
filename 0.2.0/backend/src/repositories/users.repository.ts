import type { UserDto } from "../dtos/users.dtos";

interface UsersRepository {
  findAll(): UserDto[];
  findById(id: string): UserDto | undefined;
  create(item: UserDto): UserDto;
  update(id: string, item: UserDto): UserDto;
  delete(id: string): boolean;
}

export function createUsersRepository(): UsersRepository {
  const items = new Map<string, UserDto>();

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

export type { UsersRepository };
