export function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** "28 Sep 2026" (or "5 Oct" without the year), in the device's locale. */
export function formatDate(iso: string, { withYear = true } = {}): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(new Date(iso));
}

export function initials(displayName: string | null, email: string): string {
  const source = displayName?.trim() || email;
  return source
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
