import { all, get, run } from "../db/db";
import { orderDirection, quoteSqlText } from "../db/sql";
import type { NoteDto, NotesQueryDto } from "../dtos/notes.dtos";

interface NotesRepository {
  findList(query: NotesQueryDto): NoteDto[];
  count(query: NotesQueryDto): number;
  findById(id: string): NoteDto | undefined;
  create(item: NoteDto): NoteDto;
  upsert(item: NoteDto): NoteDto;
  update(id: string, item: NoteDto): NoteDto;
  delete(id: string): boolean;
}

interface CountRow {
  total: number;
}

function buildWhereClause(query: NotesQueryDto): string {
  // Notes can be filtered by owner when the client needs one student's comments only.
  const filters: string[] = [];

  if (query.userId) {
    filters.push(`userId = ${quoteSqlText(query.userId)}`);
  }

  return filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
}

export function createNotesRepository(): NotesRepository {
  return {
    findList(query) {
      const whereClause = buildWhereClause(query);
      const offset = (query.page - 1) * query.pageSize;

      return all<NoteDto>(`
        SELECT id, userId, content, createdAt
        FROM notes
        ${whereClause}
        ORDER BY createdAt ${orderDirection(query.sortDir)}
        LIMIT ${query.pageSize}
        OFFSET ${offset};
      `);
    },
    count(query) {
      const whereClause = buildWhereClause(query);

      return (
        get<CountRow>(`
          SELECT COUNT(*) as total
          FROM notes
          ${whereClause};
        `)?.total ?? 0
      );
    },
    findById(id) {
      return get<NoteDto>(`
        SELECT id, userId, content, createdAt
        FROM notes
        WHERE id = ${quoteSqlText(id)};
      `);
    },
    create(item) {
      run(`
        INSERT INTO notes (id, userId, content, createdAt)
        VALUES (
          ${quoteSqlText(item.id)},
          ${quoteSqlText(item.userId)},
          ${quoteSqlText(item.content)},
          ${quoteSqlText(item.createdAt)}
        );
      `);

      return item;
    },
    upsert(item) {
      run(`
        INSERT INTO notes (id, userId, content, createdAt)
        VALUES (
          ${quoteSqlText(item.id)},
          ${quoteSqlText(item.userId)},
          ${quoteSqlText(item.content)},
          ${quoteSqlText(item.createdAt)}
        )
        ON CONFLICT(id) DO UPDATE SET
          userId = excluded.userId,
          content = excluded.content,
          createdAt = excluded.createdAt;
      `);

      return item;
    },
    update(id, item) {
      run(`
        UPDATE notes
        SET
          userId = ${quoteSqlText(item.userId)},
          content = ${quoteSqlText(item.content)}
        WHERE id = ${quoteSqlText(id)};
      `);

      return item;
    },
    delete(id) {
      return (
        run(`
          DELETE FROM notes
          WHERE id = ${quoteSqlText(id)};
        `).changes > 0
      );
    }
  };
}

export type { NotesRepository };
