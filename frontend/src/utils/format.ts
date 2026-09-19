import type { Priority } from '../api/types';

// Client-side mirrors of the prototype's presentational helpers. Computing
// "today" here uses the browser's local time, which for a single-timezone
// student is actually more correct than the server-side dashboard aggregate
// (see backend/README.md's timezone note).

export function fmtHours(hours: number): string {
  const minutes = Math.round(hours * 60);
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function fmtMinutes(min: number): string {
  if (!min) return '—';
  return `${Math.round((min / 60) * 10) / 10}h`;
}

function localMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dayDiff(dueDateIso: string): number {
  const due = new Date(`${dueDateIso}T00:00:00`);
  return Math.round((due.getTime() - localMidnight().getTime()) / 86400000);
}

export function countdown(n: number): string {
  if (n < 0) return `${Math.abs(n)}d late`;
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return `in ${n}d`;
}

export function dueColor(n: number, done: boolean): string {
  if (done) return 'var(--color-neutral-600)';
  if (n < 0) return 'var(--color-accent-300)';
  if (n <= 1) return 'var(--color-accent-400)';
  return 'var(--color-neutral-400)';
}

export function priorityTagClass(p: Priority): string {
  if (p === 'HIGH') return 'tag tag-accent';
  if (p === 'MEDIUM') return 'tag tag-accent2';
  return 'tag tag-neutral';
}

export function formatDateLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTimeLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function sessionHours(startAt: string, endAt: string): number {
  return Math.max(0, new Date(endAt).getTime() - new Date(startAt).getTime()) / 3600000;
}
