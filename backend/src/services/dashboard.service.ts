import { prisma } from '../lib/prisma';
import {
  dateOnlyIso, dbDateIso, dayDiff, fmtHours, localMidnight,
  sessionHours, todayIso, weekStartDate,
} from '../utils/date';

const DAY_MS = 86400000;

// Ports Scholar Pulse's streak() exactly: walk back day by day, counting the
// current unbroken run of "active" days (a logged session or a completed
// task), but let today itself be inactive without breaking the streak (a
// grace day for "haven't logged anything yet today").
export async function computeStreak(userId: string): Promise<number> {
  const sinceDate = new Date(localMidnight().getTime() - 61 * DAY_MS);

  const [sessions, doneTasks] = await Promise.all([
    prisma.studySession.findMany({ where: { userId, startAt: { gte: sinceDate } }, select: { startAt: true } }),
    prisma.task.findMany({ where: { userId, done: true, doneAt: { gte: sinceDate } }, select: { doneAt: true } }),
  ]);

  const activeDays = new Set<string>();
  for (const s of sessions) activeDays.add(dateOnlyIso(s.startAt));
  for (const t of doneTasks) if (t.doneAt) activeDays.add(dbDateIso(t.doneAt));

  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(localMidnight().getTime() - i * DAY_MS);
    if (activeDays.has(dateOnlyIso(d))) streak++;
    else if (i > 0) break;
  }
  return streak;
}

// Ports weekHours(): session time this week, plus completed Pomodoro work
// intervals logged this week (the prototype approximated this with a
// lifetime counter x the *current* work length; logging real PomodoroSession
// rows lets us sum actual minutes instead).
export async function computeWeekHours(userId: string): Promise<number> {
  const ws = weekStartDate();
  const we = new Date(ws.getTime() + 7 * DAY_MS);

  const [sessions, pomodoros] = await Promise.all([
    prisma.studySession.findMany({ where: { userId, startAt: { gte: ws, lt: we } } }),
    prisma.pomodoroSession.findMany({ where: { userId, completedAt: { gte: ws, lt: we } } }),
  ]);

  const sessionHrs = sessions.reduce((sum, s) => sum + sessionHours(s.startAt, s.endAt), 0);
  const pomoHrs = pomodoros.reduce((sum, p) => sum + p.workMinutes / 60, 0);
  return sessionHrs + pomoHrs;
}

export async function computeWeekTasksDone(userId: string): Promise<number> {
  const ws = dateOnlyIso(weekStartDate());
  const tasks = await prisma.task.findMany({ where: { userId, done: true }, select: { doneAt: true } });
  return tasks.filter(t => t.doneAt && dbDateIso(t.doneAt) >= ws).length;
}

function serializeTaskDto(t: {
  id: string; title: string; description: string | null; priority: string; type: string;
  done: boolean; estimatedMin: number; dueDate: Date; courseId: string | null;
}, courseById: Map<string, { id: string; code: string; name: string; color: string }>) {
  const dueIso = dbDateIso(t.dueDate);
  const course = t.courseId ? courseById.get(t.courseId) : undefined;
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    type: t.type,
    done: t.done,
    estimatedMin: t.estimatedMin,
    dueDate: dueIso,
    dayDiff: dayDiff(dueIso),
    course: course ? { id: course.id, code: course.code, name: course.name, color: course.color } : null,
  };
}

export async function getDashboard(userId: string) {
  const [user, courses, tasks, weekHours, weekTasksDone, streak] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.course.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId } }),
    computeWeekHours(userId),
    computeWeekTasksDone(userId),
    computeStreak(userId),
  ]);

  const courseById = new Map(courses.map(c => [c.id, c]));
  const today = todayIso();

  const openExams = tasks
    .filter(t => !t.done && t.type === 'EXAM' && dayDiff(dbDateIso(t.dueDate)) >= 0)
    .sort((a, b) => dbDateIso(a.dueDate).localeCompare(dbDateIso(b.dueDate)));

  const weeklyGoalPct = Math.min(100, Math.round((weekHours / (user.goalWeeklyHours || 1)) * 100));
  const openToday = tasks.filter(t => dbDateIso(t.dueDate) === today && !t.done).length;

  const ws = weekStartDate();
  const we = new Date(ws.getTime() + 7 * DAY_MS);
  const weekSessions = await prisma.studySession.findMany({ where: { userId, startAt: { gte: ws, lt: we } } });

  const hoursPerDay: number[] = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(ws.getTime() + i * DAY_MS);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    hoursPerDay.push(
      weekSessions
        .filter(s => s.startAt >= dayStart && s.startAt < dayEnd)
        .reduce((sum, s) => sum + sessionHours(s.startAt, s.endAt), 0),
    );
  }
  const maxDay = Math.max(3, ...hoursPerDay);
  const weekBars = hoursPerDay.map((hrs, i) => {
    const d = new Date(ws.getTime() + i * DAY_MS);
    return {
      date: dateOnlyIso(d),
      isToday: dateOnlyIso(d) === today,
      hours: Math.round(hrs * 10) / 10,
      heightPct: Math.round((hrs / maxDay) * 100),
    };
  });

  const toDto = (t: (typeof tasks)[number]) => serializeTaskDto(t, courseById);

  return {
    profileName: user.name,
    theme: user.theme,
    goals: { hours: user.goalWeeklyHours, tasks: user.goalWeeklyTasks, streak: user.goalStreakDays },
    stats: {
      weekHours,
      weekHoursLabel: fmtHours(weekHours),
      weekTasksDone,
      streak,
      upcomingExamsCount: openExams.length,
      nextExamDayDiff: openExams[0] ? dayDiff(dbDateIso(openExams[0].dueDate)) : null,
    },
    weeklyGoalPct,
    weekBars,
    todayTasks: tasks.filter(t => dbDateIso(t.dueDate) === today).map(toDto),
    openTodayCount: openToday,
    upcomingDeadlines: tasks
      .filter(t => !t.done && dayDiff(dbDateIso(t.dueDate)) >= 0)
      .sort((a, b) => dbDateIso(a.dueDate).localeCompare(dbDateIso(b.dueDate)))
      .slice(0, 6)
      .map(toDto),
    goalProgress: [
      {
        key: 'hours', label: `Study ${user.goalWeeklyHours} hours per week`,
        value: fmtHours(weekHours), pct: Math.min(100, Math.round((weekHours / user.goalWeeklyHours) * 100)),
      },
      {
        key: 'tasks', label: `Complete ${user.goalWeeklyTasks} assignments`,
        value: `${weekTasksDone} / ${user.goalWeeklyTasks}`, pct: Math.min(100, Math.round((weekTasksDone / user.goalWeeklyTasks) * 100)),
      },
      {
        key: 'streak', label: `Maintain a ${user.goalStreakDays}-day streak`,
        value: `${streak} / ${user.goalStreakDays}`, pct: Math.min(100, Math.round((streak / user.goalStreakDays) * 100)),
      },
    ],
  };
}
