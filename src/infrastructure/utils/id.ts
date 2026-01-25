// ID generation using crypto.randomUUID()
// For MVP, using UUID v4. Consider UUIDv7 or ULID for production.

export function generateId(): string {
  return crypto.randomUUID();
}
