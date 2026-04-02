
import { PersonalNoteResponseDto } from "../dtos/notes.dto";

export class NotesRepository {

  private notes: PersonalNoteResponseDto[] = [];

  findAll() {
    return this.notes;
  }

  findById(id: string) {
    return this.notes.find(n => n.id === id);
  }

  create(note: PersonalNoteResponseDto) {
    this.notes.push(note);
    return note;
  }

  update(id: string, data: Partial<PersonalNoteResponseDto>) {
    const note = this.findById(id);
    if (!note) return null;

    Object.assign(note, data);
    return note;
  }

  delete(id: string) {
    const index = this.notes.findIndex(n => n.id === id);
    if (index === -1) return false;

    this.notes.splice(index, 1);
    return true;
  }

}

export const notesRepository = new NotesRepository();
