export function formatNaira(n: number): string {
  if (!Number.isInteger(n) || n < 0) {
    n = Math.max(0, Math.round(n));
  }
  return "?" + new Intl.NumberFormat("en-NG").format(n);
}

export function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function safeNext(path: string | null | undefined): string {
  if (!path) return "/";
  if (path.startsWith("//")) return "/";
  if (path.startsWith("/")) return path;
  return "/";
}
