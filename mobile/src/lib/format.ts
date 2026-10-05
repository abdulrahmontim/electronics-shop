/**
 * Money is whole naira everywhere. The separator is applied by hand rather than
 * through Intl so the output is identical on every Android device, including
 * ones whose JavaScript engine ships without full locale data.
 */
function groupDigits(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatNaira(amount: number): string {
  const value = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `\u20A6${groupDigits(value)}`;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDay(value: Date | string): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateTime(value: Date | string): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatDay(date)}, ${hours}:${minutes}`;
}

/** Orders are referenced by the first eight characters of their id. */
export function orderReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function statusLabel(status: string): string {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
}

export function clampQuantity(value: number): number {
  const whole = Math.floor(Number.isFinite(value) ? value : 0);
  return Math.max(1, Math.min(20, whole));
}

/** Keeps a redirect inside the app: a leading slash, never a protocol-relative URL. */
export function safeNext(path: string | null | undefined): string {
  if (!path) return '/';
  if (path.startsWith('//')) return '/';
  if (path.startsWith('/')) return path;
  return '/';
}