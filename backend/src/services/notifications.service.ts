import { NotificationType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { computeStreak } from './dashboard.service';
import { dayDiff, dbDateIso, localMidnight } from '../utils/date';

async function alreadyNotifiedToday(userId: string, type: NotificationType, taskId?: string): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: { userId, type, taskId: taskId ?? undefined, createdAt: { gte: localMidnight() } },
  });
  return !!existing;
}

export async function generateNotificationsForUser(userId: string) {
  const created: unknown[] = [];
  const openTasks = await prisma.task.findMany({ where: { userId, done: false } });

  for (const t of openTasks) {
    const diff = dayDiff(dbDateIso(t.dueDate));

    if (diff >= 0 && diff <= 1) {
      const type: NotificationType = t.type === 'EXAM' ? 'EXAM_REMINDER' : 'TASK_DUE_SOON';
      if (!(await alreadyNotifiedToday(userId, type, t.id))) {
        created.push(await prisma.notification.create({
          data: {
            userId, type, taskId: t.id,
            title: t.type === 'EXAM' ? `Exam coming up: ${t.title}` : `Due soon: ${t.title}`,
            body: diff === 0 ? 'Due today.' : 'Due tomorrow.',
            scheduledFor: new Date(),
          },
        }));
      }
    } else if (t.type === 'EXAM' && diff > 1 && diff <= 3) {
      if (!(await alreadyNotifiedToday(userId, 'EXAM_REMINDER', t.id))) {
        created.push(await prisma.notification.create({
          data: {
            userId, type: 'EXAM_REMINDER', taskId: t.id,
            title: `Exam in ${diff} days: ${t.title}`,
            body: 'Time to start reviewing.',
            scheduledFor: new Date(),
          },
        }));
      }
    }
  }

  // Evening-only streak-at-risk check: give the day a chance to happen first.
  if (new Date().getHours() >= 18) {
    const [streak, studiedToday, doneToday] = await Promise.all([
      computeStreak(userId),
      prisma.studySession.findFirst({ where: { userId, startAt: { gte: localMidnight() } } }),
      prisma.task.findFirst({ where: { userId, done: true, doneAt: { gte: localMidnight() } } }),
    ]);

    if (streak > 0 && !studiedToday && !doneToday && !(await alreadyNotifiedToday(userId, 'STREAK_RISK'))) {
      created.push(await prisma.notification.create({
        data: {
          userId, type: 'STREAK_RISK',
          title: `Don't lose your ${streak}-day streak`,
          body: 'Log a session or finish a task before the day ends.',
          scheduledFor: new Date(),
        },
      }));
    }
  }

  return created;
}

export async function generateNotificationsForAllUsers() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) await generateNotificationsForUser(u.id);
}
