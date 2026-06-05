import { all, get, run } from "../db/db";
import { orderDirection, quoteSqlText } from "../db/sql";
import type { NoteDto, NotesQueryDto } from "../dtos/notes.dtos";

interface NotesRepository {
  findList(query: NotesQueryDto, ownerUserId: string): NoteDto[];
  count(query: NotesQueryDto, ownerUserId: string): number;
  findById(id: string): NoteDto | undefined;
  findByIdForUser(id: string, ownerUserId: string): NoteDto | undefined;
  create(item: NoteDto): NoteDto;
  upsert(item: NoteDto): NoteDto;
  update(id: string, item: NoteDto): NoteDto;
  updateForUser(id: string, ownerUserId: string, item: NoteDto): boolean;
  delete(id: string): boolean;
  deleteForUser(id: string, ownerUserId: string): boolean;
}

interface CountRow {
  total: number;
}

export function createNotesRepository(): NotesRepository {
  return {
    findList(query, ownerUserId) {
      const offset = (query.page - 1) * query.pageSize;

      return all<NoteDto>(`
        SELECT id, userId, content, createdAt
        FROM notes
        WHERE userId = ?
        ORDER BY createdAt ${orderDirection(query.sortDir)}
        LIMIT ${query.pageSize}
        OFFSET ${offset};
      `, [ownerUserId]);
    },
    count(_query, ownerUserId) {
      return (
        get<CountRow>(`
          SELECT COUNT(*) as total
          FROM notes
          WHERE userId = ?;
        `, [ownerUserId])?.total ?? 0
      );
    },
    findById(id) {
      return get<NoteDto>(`
        SELECT id, userId, content, createdAt
        FROM notes
        WHERE id = ${quoteSqlText(id)};
      `);
    },
    findByIdForUser(id, ownerUserId) {
      // IDOR-захист: ресурс шукається одразу за id і власником.
      return get<NoteDto>(`
        SELECT id, userId, content, createdAt
        FROM notes
        WHERE id = ? AND userId = ?;
      `, [id, ownerUserId]);
    },
    create(item) {
      run(`
        INSERT INTO notes (id, userId, content, createdAt)
        VALUES (?, ?, ?, ?);
      `, [item.id, item.userId, item.content, item.createdAt]);

      return item;
    },
    upsert(item) {
      run(`
        INSERT INTO notes (id, userId, content, createdAt)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          userId = excluded.userId,
          content = excluded.content,
          createdAt = excluded.createdAt;
      `, [item.id, item.userId, item.content, item.createdAt]);

      return item;
    },
    update(id, item) {
      run(`
        UPDATE notes
        SET
          userId = ?,
          content = ?
        WHERE id = ?;
      `, [item.userId, item.content, id]);

      return item;
    },
    updateForUser(id, ownerUserId, item) {
      // Оновлення додатково обмежене власником, навіть якщо id існує.
      return (
        run(`
          UPDATE notes
          SET content = ?
          WHERE id = ? AND userId = ?;
        `, [item.content, id, ownerUserId]).changes > 0
      );
    },
    delete(id) {
      return (
        run(`
          DELETE FROM notes
          WHERE id = ${quoteSqlText(id)};
        `).changes > 0
      );
    },
    deleteForUser(id, ownerUserId) {
      // Видалення чужого id не зачепить рядок і буде оброблене як 404.
      return (
        run(`
          DELETE FROM notes
          WHERE id = ? AND userId = ?;
        `, [id, ownerUserId]).changes > 0
      );
    }
  };
}

export type { NotesRepository };
