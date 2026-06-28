// ============================================================
// CampusRide — Date/Time Utilities (IST-safe)
// ============================================================
// Supabase TIMESTAMPTZ stores UTC internally, but PostgreSQL
// returns the value with the timezone offset of the stored
// string. We always store a local IST offset string so the
// value is preserved exactly as the user selected it.
// ============================================================

const IST_LOCALE = "en-IN";
const IST_TZ     = "Asia/Kolkata";

/**
 * Convert a local datetime-local input value ("2026-06-22T10:00")
 * to a PostgreSQL-compatible ISO string WITH the +05:30 offset
 * so Supabase stores the user's intended local time, not UTC.
 *
 * Example: "2026-06-22T10:00" → "2026-06-22T10:00:00+05:30"
 */
export function toISTISOString(dateStr: string, timeStr: string): string {
  // Combine date and time parts
  const combined = `${dateStr}T${timeStr}:00`;
  // Append IST offset — no conversion, stored as entered
  return `${combined}+05:30`;
}

/**
 * Display a UTC/ISO timestamp in IST date format.
 * "2026-06-22T04:30:00+00:00" → "22 June 2026"
 */
export function formatISTDate(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString(IST_LOCALE, {
    timeZone: IST_TZ,
    day:      "numeric",
    month:    "long",
    year:     "numeric",
  });
}

/**
 * Display a UTC/ISO timestamp in IST short date format.
 * "2026-06-22T04:30:00+00:00" → "22/06/2026"
 */
export function formatISTDateShort(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString(IST_LOCALE, {
    timeZone: IST_TZ,
    day:      "2-digit",
    month:    "2-digit",
    year:     "numeric",
  });
}

/**
 * Display a UTC/ISO timestamp as IST time.
 * "2026-06-22T04:30:00+00:00" → "10:00 AM"
 */
export function formatISTTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString(IST_LOCALE, {
    timeZone: IST_TZ,
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   true,
  });
}

/**
 * Display a UTC/ISO timestamp as full IST datetime.
 * "2026-06-22T04:30:00+00:00" → "22 June 2026, 10:00 AM"
 */
export function formatISTDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString(IST_LOCALE, {
    timeZone: IST_TZ,
    day:      "numeric",
    month:    "long",
    year:     "numeric",
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   true,
  });
}

/**
 * Compute duration in whole days between two ISO timestamps.
 * Falls back to 1 if the result is 0 or negative.
 */
export function durationDays(
  startIso: string | null | undefined,
  endIso:   string | null | undefined
): number {
  if (!startIso || !endIso) return 1;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
