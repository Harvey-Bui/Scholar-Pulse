import { prisma } from '../lib/prisma';
import { dateOnlyIso, localMidnight, toDbDate } from '../utils/date';

const DAY_MS = 86400000;
const MAX_CHUNK_MIN = 90;
const MIN_USABLE_MIN = 15;
const PRIORITY_RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

interface FreeSlot {
  start: Date;
  end: Date;
}

function parseHm(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

async function buildFreeSlots(userId: string, horizonDays: number): Promise<FreeSlot[]> {
  const windows = await prisma.availabilityWindow.findMany({ where: { userId } });
  if (windows.length === 0) return [];

  const rangeStart = localMidnight();
  const rangeEnd = new Date(rangeStart.getTime() + horizonDays * DAY_MS);
  const busySessions = await prisma.studySession.findMany({
    where: { userId, startAt: { lt: rangeEnd }, endAt: { gt: rangeStart } },
    orderBy: { startAt: 'asc' },
  });

  const slots: FreeSlot[] = [];
  for (let i = 0; i < horizonDays; i++) {
    const dayStart = new Date(rangeStart.getTime() + i * DAY_MS);
    const dow = dayStart.getDay();
    for (const w of windows.filter(win => win.dayOfWeek === dow)) {
      const slotStart = new Date(dayStart.getTime() + parseHm(w.startTime) * 60000);
      const slotEnd = new Date(dayStart.getTime() + parseHm(w.endTime) * 60000);
      if (slotEnd <= slotStart) continue;

      const overlapping = busySessions
        .filter(s => s.startAt < slotEnd && s.endAt > slotStart)
        .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

      let cursor = slotStart;
      for (const busy of overlapping) {
        if (busy.startAt > cursor) {
          slots.push({ start: cursor, end: new Date(Math.min(busy.startAt.getTime(), slotEnd.getTime())) });
        }
        if (busy.endAt > cursor) cursor = busy.endAt > slotEnd ? slotEnd : busy.endAt;
      }
      if (cursor < slotEnd) slots.push({ start: cursor, end: slotEnd });
    }
  }

  return slots
    .filter(s => (s.end.getTime() - s.start.getTime()) / 60000 >= MIN_USABLE_MIN)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export interface ScheduleProposal {
  taskId: string;
  courseId: string | null;
  startAt: Date;
  endAt: Date;
}

// Greedy first-fit interval packing: earliest-due, then highest-priority
// tasks claim the earliest free slots first; each task's leftover minutes
// spill into the next free slot until either the task is fully scheduled or
// it runs out of slots before its due date.
export async function suggestSchedule(
  userId: string,
  opts: { taskIds?: string[]; horizonDays?: number },
): Promise<{ proposals: ScheduleProposal[]; unscheduled: { taskId: string; remainingMin: number }[] }> {
  const horizonDays = opts.horizonDays ?? 14;
  const rangeEndIso = dateOnlyIso(new Date(localMidnight().getTime() + horizonDays * DAY_MS));

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      done: false,
      ...(opts.taskIds ? { id: { in: opts.taskIds } } : { dueDate: { lt: toDbDate(rangeEndIso) } }),
    },
  });

  tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime() || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

  const freeSlots = await buildFreeSlots(userId, horizonDays);
  const proposals: ScheduleProposal[] = [];
  const unscheduled: { taskId: string; remainingMin: number }[] = [];

  for (const task of tasks) {
    let remaining = task.estimatedMin;
    for (const slot of freeSlots) {
      if (remaining <= 0) break;
      if (slot.start >= task.dueDate) continue;
      const slotMin = (slot.end.getTime() - slot.start.getTime()) / 60000;
      if (slotMin < MIN_USABLE_MIN) continue;

      const chunk = Math.min(remaining, MAX_CHUNK_MIN, slotMin);
      const chunkEnd = new Date(slot.start.getTime() + chunk * 60000);
      proposals.push({ taskId: task.id, courseId: task.courseId, startAt: slot.start, endAt: chunkEnd });
      slot.start = chunkEnd;
      remaining -= chunk;
    }
    if (remaining > 0) unscheduled.push({ taskId: task.id, remainingMin: remaining });
  }

  return { proposals, unscheduled };
}
