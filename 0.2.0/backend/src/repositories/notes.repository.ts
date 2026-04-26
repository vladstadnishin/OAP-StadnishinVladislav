import type { NoteDto } from "../dtos/notes.dtos";

interface NotesRepository {
  findAll(): NoteDto[];
  findById(id: string): NoteDto | undefined;
  create(item: NoteDto): NoteDto;
  update(id: string, item: NoteDto): NoteDto;
  delete(id: string): boolean;
}

export function createNotesRepository(): NotesRepository {
  const items = new Map<string, NoteDto>();

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

export type { NotesRepository };
