import { all, get, run } from "../db/db";
import { orderDirection, quoteSqlText } from "../db/sql";
import type { TeacherDto, TeachersQueryDto } from "../dtos/teachers.dtos";

interface TeachersRepository {
  findList(query: TeachersQueryDto): TeacherDto[];
  count(query: TeachersQueryDto): number;
  findById(id: string): TeacherDto | undefined;
  findByFullName(fullName: string): TeacherDto | undefined;
  create(item: TeacherDto): TeacherDto;
  update(id: string, item: TeacherDto): TeacherDto;
  delete(id: string): boolean;
  unsafeSearch(search: string): TeacherDto[];
}

interface CountRow {
  total: number;
}

function buildWhereClause(query: TeachersQueryDto): string {
  // Centralized filter building keeps SQL out of routes/controllers and matches the lab structure.
  const filters: string[] = [];

  if (query.search) {
    const searchPattern = quoteSqlText(`%${query.search.toLowerCase()}%`);
    filters.push(`lower(fullName) LIKE ${searchPattern}`);
  }

  return filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
}

export function createTeachersRepository(): TeachersRepository {
  return {
    findList(query) {
      const whereClause = buildWhereClause(query);
      const offset = (query.page - 1) * query.pageSize;

      return all<TeacherDto>(`
        SELECT id, fullName, createdAt
        FROM teachers
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
          FROM teachers
          ${whereClause};
        `)?.total ?? 0
      );
    },
    findById(id) {
      return get<TeacherDto>(`
        SELECT id, fullName, createdAt
        FROM teachers
        WHERE id = ${quoteSqlText(id)};
      `);
    },
    findByFullName(fullName) {
      return get<TeacherDto>(`
        SELECT id, fullName, createdAt
        FROM teachers
        WHERE lower(trim(fullName)) = lower(${quoteSqlText(fullName.trim())});
      `);
    },
    create(item) {
      run(`
        INSERT INTO teachers (id, fullName, createdAt)
        VALUES (
          ${quoteSqlText(item.id)},
          ${quoteSqlText(item.fullName)},
          ${quoteSqlText(item.createdAt)}
        );
      `);

      return item;
    },
    update(id, item) {
      run(`
        UPDATE teachers
        SET
          fullName = ${quoteSqlText(item.fullName)}
        WHERE id = ${quoteSqlText(id)};
      `);

      return item;
    },
    delete(id) {
      return (
        run(`
          DELETE FROM teachers
          WHERE id = ${quoteSqlText(id)};
        `).changes > 0
      );
    },
    unsafeSearch(search) {
      // Intentionally unsafe query for the SQL injection demonstration part of the lab.
      // We keep string concatenation here on purpose and document it in README.
      return all<TeacherDto>(`
        SELECT id, fullName, createdAt
        FROM teachers
        WHERE lower(fullName) LIKE lower('%${search}%')
        ORDER BY createdAt DESC
        LIMIT 20;
      `);
    }
  };
}

export type { TeachersRepository };
