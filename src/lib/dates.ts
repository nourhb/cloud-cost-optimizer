/** Date helpers for billing periods (UTC date strings YYYY-MM-DD). */

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function formatMonthLabel(isoDate: string, locale = "en-CA"): string {
  if (!isValidIsoDate(isoDate)) {
    return isoDate;
  }
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
