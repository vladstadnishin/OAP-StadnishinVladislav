import { all, get, run } from "../db/db";
import { orderDirection, quoteSqlText } from "../db/sql";
import type {
  NameDto,
  NamePriorityStatDto,
  NameWithUserDto,
  NamesQueryDto,
  NamesStatsQueryDto
} from "../dtos/names.dtos";

interface NamesRepository {
  findList(query: NamesQueryDto): NameDto[];
  count(query: NamesQueryDto): number;
  findById(id: string): NameDto | undefined;
  create(item: NameDto): NameDto;
  update(id: string, item: NameDto): NameDto;
  delete(id: string): boolean;
  findWithUsers(query: NamesQueryDto): NameWithUserDto[];
  getPriorityStats(query: NamesStatsQueryDto): NamePriorityStatDto[];
  findDistinctTeacherNames(): string[];
  hasTeacherName(fullName: string): boolean;
  findAllAsNotes(): Array<Pick<NameDto, "id" | "userId" | "createdAt"> & { content: string }>;
}

interface CountRow {
  total: number;
}

interface TeacherNameRow {
  teacher: string;
}

interface NameNoteRow {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

function buildWhereClause(query: Pick<NamesQueryDto, "priority" | "userId">): string {
  // This main entity supports both filtering by owner and filtering by priority.
  const filters: string[] = [];

  if (query.priority) {
    filters.push(`priority = ${quoteSqlText(query.priority)}`);
  }

  if (query.userId) {
    filters.push(`userId = ${quoteSqlText(query.userId)}`);
  }

  return filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
}

export function createNamesRepository(): NamesRepository {
  return {
    findList(query) {
      // This query satisfies the lab requirement to use WHERE + ORDER BY + LIMIT in real CRUD.
      const whereClause = buildWhereClause(query);
      const offset = (query.page - 1) * query.pageSize;

      return all<NameDto>(`
        SELECT id, userId, title, teacher, course, priority, note, createdAt
        FROM names
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
          FROM names
          ${whereClause};
        `)?.total ?? 0
      );
    },
    findById(id) {
      return get<NameDto>(`
        SELECT id, userId, title, teacher, course, priority, note, createdAt
        FROM names
        WHERE id = ${quoteSqlText(id)};
      `);
    },
    create(item) {
      // All writes go through raw SQL, not an ORM and not an in-memory array.
      run(`
        INSERT INTO names (id, userId, title, teacher, course, priority, note, createdAt)
        VALUES (
          ${quoteSqlText(item.id)},
          ${quoteSqlText(item.userId)},
          ${quoteSqlText(item.title)},
          ${quoteSqlText(item.teacher)},
          ${quoteSqlText(item.course)},
          ${quoteSqlText(item.priority)},
          ${quoteSqlText(item.note)},
          ${quoteSqlText(item.createdAt)}
        );
      `);

      return item;
    },
    update(id, item) {
      // PUT/PATCH reuse the same UPDATE statement after the service builds the final DTO.
      run(`
        UPDATE names
        SET
          userId = ${quoteSqlText(item.userId)},
          title = ${quoteSqlText(item.title)},
          teacher = ${quoteSqlText(item.teacher)},
          course = ${quoteSqlText(item.course)},
          priority = ${quoteSqlText(item.priority)},
          note = ${quoteSqlText(item.note)}
        WHERE id = ${quoteSqlText(id)};
      `);

      return item;
    },
    delete(id) {
      return (
        run(`
          DELETE FROM names
          WHERE id = ${quoteSqlText(id)};
        `).changes > 0
      );
    },
    findWithUsers(query) {
      // Required "JOIN endpoint": returns the entity together with related user data.
      const whereClause = buildWhereClause(query);
      const offset = (query.page - 1) * query.pageSize;

      return all<NameWithUserDto>(`
        SELECT
          names.id,
          names.userId,
          names.title,
          names.teacher,
          names.course,
          names.priority,
          names.note,
          names.createdAt,
          users.fullName as userFullName,
          users.email as userEmail
        FROM names
        INNER JOIN users ON users.id = names.userId
        ${whereClause}
        ORDER BY names.createdAt ${orderDirection(query.sortDir)}
        LIMIT ${query.pageSize}
        OFFSET ${offset};
      `);
    },
    getPriorityStats(query) {
      // Required aggregation endpoint: COUNT(*) grouped by priority.
      const whereClause = query.userId
        ? `WHERE userId = ${quoteSqlText(query.userId)}`
        : "";

      return all<NamePriorityStatDto>(`
        SELECT priority, COUNT(*) as total
        FROM names
        ${whereClause}
        GROUP BY priority
        ORDER BY CASE priority
          WHEN 'Високий' THEN 1
          WHEN 'Середній' THEN 2
          ELSE 3
        END;
      `);
    },
    findDistinctTeacherNames() {
      // Distinct teacher names let the teachers endpoint catch up with records created through names.
      return all<TeacherNameRow>(`
        SELECT DISTINCT trim(teacher) as teacher
        FROM names
        WHERE trim(teacher) <> ''
        ORDER BY teacher ASC;
      `).map(item => item.teacher);
    },
    hasTeacherName(fullName) {
      return (
        (get<CountRow>(`
          SELECT COUNT(*) as total
          FROM names
          WHERE lower(trim(teacher)) = lower(${quoteSqlText(fullName.trim())});
        `)?.total ?? 0) > 0
      );
    },
    findAllAsNotes() {
      return all<NameNoteRow>(`
        SELECT id, userId, trim(note) as content, createdAt
        FROM names
        WHERE trim(note) <> ''
        ORDER BY createdAt DESC;
      `);
    }
  };
}

export type { NamesRepository };