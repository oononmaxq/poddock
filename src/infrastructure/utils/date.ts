// Date utilities

/**
 * Returns current timestamp in ISO 8601 format (UTC)
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Formats a Date to RFC 2822 format (required for RSS pubDate)
 * Example: "Sat, 24 Jan 2026 03:00:00 GMT"
 */
export function formatRFC2822(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const dayName = days[date.getUTCDay()];
  const day = date.getUTCDate().toString().padStart(2, '0');
  const monthName = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');

  return `${dayName}, ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds} GMT`;
}
