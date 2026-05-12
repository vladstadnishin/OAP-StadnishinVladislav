import { all, get, run } from "../db/db";
import { orderDirection, quoteSqlText } from "../db/sql";
import type { UserDto, UsersQueryDto } from "../dtos/users.dtos";

interface UsersRepository {
  findList(query: UsersQueryDto): UserDto[];
  count(query: UsersQueryDto): number;
  findById(id: string): UserDto | undefined;
  create(item: UserDto): UserDto;
  update(id: string, item: UserDto): UserDto;
  delete(id: string): boolean;
}

interface CountRow {
  total: number;
}

function buildWhereClause(query: UsersQueryDto): string {
  // All optional filters are assembled in one place so raw SQL stays inside the repository.
  const filters: string[] = [];

  if (query.search) {
    const searchPattern = quoteSqlText(`%${query.search.toLowerCase()}%`);
    filters.push(`lower(fullName || ' ' || email) LIKE ${searchPattern}`);
  }

  return filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
}

export function createUsersRepository(): UsersRepository {
  return {
    findList(query) {
      // Standard list endpoint pattern: WHERE + ORDER BY + LIMIT + OFFSET.
      const whereClause = buildWhereClause(query);
      const offset = (query.page - 1) * query.pageSize;

      return all<UserDto>(`
        SELECT id, fullName, email, createdAt
        FROM users
        ${whereClause}
        ORDER BY createdAt ${orderDirection(query.sortDir)}
        LIMIT ${query.pageSize}
        OFFSET ${offset};
      `);
    },
    count(query) {
      // Total count is returned separately for pagination metadata.
      const whereClause = buildWhereClause(query);

      return (
        get<CountRow>(`
          SELECT COUNT(*) as total
          FROM users
          ${whereClause};
        `)?.total ?? 0
      );
    },
    findById(id) {
      // Repository returns undefined when the row does not exist; service turns that into 404.
      return get<UserDto>(`
        SELECT id, fullName, email, createdAt
        FROM users
        WHERE id = ${quoteSqlText(id)};
      `);
    },
    create(item) {
      // UUID is generated in the service layer; repository only persists it.
      run(`
        INSERT INTO users (id, fullName, email, createdAt)
        VALUES (
          ${quoteSqlText(item.id)},
          ${quoteSqlText(item.fullName)},
          ${quoteSqlText(item.email)},
          ${quoteSqlText(item.createdAt)}
        );
      `);

      return item;
    },
    update(id, item) {
      run(`
        UPDATE users
        SET
          fullName = ${quoteSqlText(item.fullName)},
          email = ${quoteSqlText(item.email)}
        WHERE id = ${quoteSqlText(id)};
      `);

      return item;
    },
    delete(id) {
      // Boolean delete result makes it easy to reason about 404 / 204 decisions upstream.
      return (
        run(`
          DELETE FROM users
          WHERE id = ${quoteSqlText(id)};
        `).changes > 0
      );
    }
  };
}

export type { UsersRepository };
