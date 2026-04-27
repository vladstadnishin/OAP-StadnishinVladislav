// Lab 3 intentionally avoids prepared statements for now, so string values
// must be escaped manually before we interpolate them into raw SQL.
export function escapeSqlText(value: string): string {
  return value.replace(/'/g, "''");
}

// Wrap a plain string into a SQL text literal.
export function quoteSqlText(value: string): string {
  return `'${escapeSqlText(value)}'`;
}

// Sorting direction is limited to two safe values before it reaches SQL.
export function orderDirection(direction: "asc" | "desc"): "ASC" | "DESC" {
  return direction === "asc" ? "ASC" : "DESC";
}
