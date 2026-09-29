// Drizzle wraps driver errors (DrizzleQueryError) and keeps the postgres.js error as `cause`.
export function isUniqueViolation(error: unknown): boolean {
  const code = (value: unknown): unknown =>
    typeof value === 'object' && value !== null && 'code' in value ? value.code : undefined;
  return code(error) === '23505' || (error instanceof Error && code(error.cause) === '23505');
}
