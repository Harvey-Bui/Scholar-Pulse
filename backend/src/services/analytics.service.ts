import { prisma } from '../lib/prisma';
import { dateOnlyIso, localMidnight, sessionHours } from '../utils/date';

const DAY_MS = 86400000;

export async function getSummary(userId: string, range: 'week' | 'month' | 'semester') {
  const days = range === 'week' ? 7 : range === 'month' ? 30 : 120;
  const rangeStart = new Date(localMidnight().getTime() - (days - 1) * DAY_MS);

  const [sessions, tasksDone, allTasksInRange] = await Promise.all([
    prisma.studySession.findMany({ where: { userId, startAt: { gte: rangeStart } } }),
    prisma.task.findMany({ where: { userId, done: true, doneAt: { gte: rangeStart } } }),
    prisma.task.findMany({ where: { userId, dueDate: { gte: rangeStart } } }),
  ]);

  const hoursByDay = new Map<string, number>();
  const hoursByCourse = new Map<string, number>();
  for (const s of sessions) {
    const hrs = sessionHours(s.startAt, s.endAt);
    const dayKey = dateOnlyIso(s.startAt);
    hoursByDay.set(dayKey, (hoursByDay.get(dayKey) || 0) + hrs);
    const courseKey = s.courseId || 'unassigned';
    hoursByCourse.set(courseKey, (hoursByCourse.get(courseKey) || 0) + hrs);
  }

  const trend: { date: string; hours: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(localMidnight().getTime() - i * DAY_MS);
    const key = dateOnlyIso(d);
    trend.push({ date: key, hours: Math.round((hoursByDay.get(key) || 0) * 10) / 10 });
  }

  const totalHours = [...hoursByDay.values()].reduce((a, b) => a + b, 0);
  const completionRate = allTasksInRange.length ? Math.round((tasksDone.length / allTasksInRange.length) * 100) : 0;

  return {
    range,
    trend,
    totalHours: Math.round(totalHours * 10) / 10,
    tasksCompleted: tasksDone.length,
    tasksTotal: allTasksInRange.length,
    completionRate,
    hoursByCourse: Object.fromEntries(
      [...hoursByCourse.entries()].map(([k, v]) => [k, Math.round(v * 10) / 10]),
    ),
  };
}

export async function getCourseBreakdown(userId: string) {
  const courses = await prisma.course.findMany({
    where: { userId },
    include: { sessions: true, tasks: true },
  });

  return courses.map(c => {
    const hours = c.sessions.reduce((a, s) => a + sessionHours(s.startAt, s.endAt), 0);
    const openTasks = c.tasks.filter(t => !t.done).length;
    return {
      id: c.id,
      name: c.name,
      code: c.code,
      credits: c.credits,
      color: c.color,
      hoursStudied: Math.round(hours * 10) / 10,
      openTasks,
    };
  });
}
