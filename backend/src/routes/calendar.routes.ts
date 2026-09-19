import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { dateOnlyIso, dbDateIso, toDbDate } from '../utils/date';

const router = Router();
const DAY_MS = 86400000;

const querySchema = z.object({
  view: z.enum(['month', 'week']).default('month'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.get('/', asyncHandler(async (req, res) => {
  const { view, date } = querySchema.parse(req.query);
  const anchor = new Date(`${date}T00:00:00`);

  let rangeStart: Date;
  let rangeEnd: Date;
  if (view === 'week') {
    const offset = (anchor.getDay() + 6) % 7;
    rangeStart = new Date(anchor.getTime() - offset * DAY_MS);
    rangeEnd = new Date(rangeStart.getTime() + 7 * DAY_MS);
  } else {
    rangeStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    rangeEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  }

  const rangeStartIso = dateOnlyIso(rangeStart);
  const rangeEndIso = dateOnlyIso(rangeEnd);

  const [tasks, sessions] = await Promise.all([
    prisma.task.findMany({
      where: { userId: req.userId, dueDate: { gte: toDbDate(rangeStartIso), lt: toDbDate(rangeEndIso) } },
      include: { course: true },
    }),
    prisma.studySession.findMany({
      where: { userId: req.userId, startAt: { gte: rangeStart, lt: rangeEnd } },
      include: { course: true },
    }),
  ]);

  const days = new Map<string, { tasks: unknown[]; sessions: unknown[] }>();
  const ensure = (key: string) => {
    let bucket = days.get(key);
    if (!bucket) {
      bucket = { tasks: [], sessions: [] };
      days.set(key, bucket);
    }
    return bucket;
  };

  for (const t of tasks) {
    ensure(dbDateIso(t.dueDate)).tasks.push({
      id: t.id, title: t.title, type: t.type, done: t.done,
      course: t.course ? { code: t.course.code, color: t.course.color } : null,
    });
  }
  for (const s of sessions) {
    ensure(dateOnlyIso(s.startAt)).sessions.push({
      id: s.id, startAt: s.startAt, endAt: s.endAt,
      course: s.course ? { code: s.course.code, color: s.course.color } : null,
    });
  }

  res.json({
    view,
    rangeStart: rangeStartIso,
    rangeEnd: dateOnlyIso(new Date(rangeEnd.getTime() - DAY_MS)),
    days: Object.fromEntries(days),
  });
}));

export default router;
