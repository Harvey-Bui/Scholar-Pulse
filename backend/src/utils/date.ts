// Date helpers ported from the prototype's client-side logic. "Today" and week
// boundaries are read from the server's local clock (see backend/README.md's
// "Known simplification" note). @db.Date columns (Task.dueDate, Task.doneAt)
// round-trip through Prisma as a UTC-midnight instant for the stored calendar
// day, so they need UTC getters — real timestamps (StudySession, PomodoroSession)
// use local getters like the rest of this module.

const DAY_MS = 86400000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function localMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dateOnlyIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayIso(): string {
  return dateOnlyIso(localMidnight());
}

export function shiftDays(n: number): string {
  return dateOnlyIso(new Date(localMidnight().getTime() + n * DAY_MS));
}

export function weekStartDate(): Date {
  const d = localMidnight();
  const offset = (d.getDay() + 6) % 7; // Monday-based week
  return new Date(d.getTime() - offset * DAY_MS);
}

export function dbDateIso(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function toDbDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function dayDiff(dateIso: string): number {
  const due = toDbDate(dateIso).getTime();
  const today = toDbDate(todayIso()).getTime();
  return Math.round((due - today) / DAY_MS);
}

export function fmtHours(hours: number): string {
  const minutes = Math.round(hours * 60);
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function sessionHours(startAt: Date, endAt: Date): number {
  return Math.max(0, endAt.getTime() - startAt.getTime()) / 3600000;
}
