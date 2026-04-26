import type { NameDto } from "../dtos/names.dtos";

interface NamesRepository {
  findAll(): NameDto[];
  findById(id: string): NameDto | undefined;
  create(item: NameDto): NameDto;
  update(id: string, item: NameDto): NameDto;
  delete(id: string): boolean;
}

export function createNamesRepository(): NamesRepository {
  const items = new Map<string, NameDto>();

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

export type { NamesRepository };
