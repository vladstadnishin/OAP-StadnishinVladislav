
import { v4 as uuid } from "uuid";
import { notesRepository } from "../repositories/notes.repository";
import { CreatePersonalNoteRequestDto, UpdatePersonalNoteRequestDto } from "../dtos/notes.dto";

export class NotesService {

  getAll(query: any) {             //Фільтрація, сортування та пагінація

    let result = [...notesRepository.findAll()];

    if (query.teacher) { 
      result = result.filter(n => n.teacher === query.teacher);     //Фільтрація
    }

    if (query.course) {
      result = result.filter(n => n.course === query.course);
    }

    if (query.priority) {
      result = result.filter(n => n.priority === query.priority);
    }

    if (query.sortBy) {                                                  //Сортування

      const dir = query.sortDir === "desc" ? -1 : 1;

      result.sort((a: any, b: any) => {
        if (a[query.sortBy] > b[query.sortBy]) return dir;
        if (a[query.sortBy] < b[query.sortBy]) return -dir;
        return 0;
      });

    }

    const page = Number(query.page) || 1;          //Пагінація
    const pageSize = Number(query.pageSize) || 10;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const items = result.slice(start, end);

    return {
      items,
      total: result.length,
      page,
    };

  }

  getById(id: string) {
    const note = notesRepository.findById(id);
    if (!note) {
      throw { status: 404, message: "Note not found" };       //Обробка конфліктів та помилок
    }
    return note;
  }

  create(data: CreatePersonalNoteRequestDto) {

    if (!data.teacher || !data.course || !data.priority) {                      //Валідація
      throw { status: 400, message: "teacher, course and priority required" };
    }

    const note = {
      id: uuid(),
      userId: data.userId,
      title: data.title,
      teacher: data.teacher,
      course: data.course,
      priority: data.priority,
      createdAt: new Date().toISOString()
    };

    return notesRepository.create(note);

  }

  update(id: string, data: UpdatePersonalNoteRequestDto) {

    const note = notesRepository.update(id, data);
    if (!note) {
      throw { status: 404, message: "Note not found" };
    }

    return note;
  }

  delete(id: string) {

    const ok = notesRepository.delete(id);
    if (!ok) {
      throw { status: 404, message: "Note not found" };
    }
  }
}

export const notesService = new NotesService();