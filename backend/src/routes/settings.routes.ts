import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { userPublicSelect } from '../lib/serializers';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, select: userPublicSelect });
  res.json({
    profile: { name: user.name, email: user.email, program: user.program, semester: user.currentSemester },
    goals: { hours: user.goalWeeklyHours, tasks: user.goalWeeklyTasks, streak: user.goalStreakDays },
    pomodoroConfig: { work: user.pomodoroWorkMinutes, break: user.pomodoroBreakMinutes },
    theme: user.theme,
  });
}));

const profileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  program: z.string().max(200).optional(),
  semester: z.string().max(60).optional(),
});

router.patch('/profile', asyncHandler(async (req, res) => {
  const data = profileSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { name: data.name, program: data.program, currentSemester: data.semester },
    select: userPublicSelect,
  });
  res.json(user);
}));

const goalsSchema = z.object({
  hours: z.number().int().min(1).max(80).optional(),
  tasks: z.number().int().min(1).max(30).optional(),
  streak: z.number().int().min(1).max(60).optional(),
});

router.patch('/goals', asyncHandler(async (req, res) => {
  const data = goalsSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { goalWeeklyHours: data.hours, goalWeeklyTasks: data.tasks, goalStreakDays: data.streak },
    select: userPublicSelect,
  });
  res.json(user);
}));

const pomodoroCfgSchema = z.object({
  work: z.number().int().min(5).max(90).optional(),
  break: z.number().int().min(1).max(30).optional(),
});

router.patch('/pomodoro', asyncHandler(async (req, res) => {
  const data = pomodoroCfgSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { pomodoroWorkMinutes: data.work, pomodoroBreakMinutes: data.break },
    select: userPublicSelect,
  });
  res.json(user);
}));

const themeSchema = z.object({ theme: z.enum(['DAY', 'NIGHT']) });

router.patch('/theme', asyncHandler(async (req, res) => {
  const { theme } = themeSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.userId }, data: { theme }, select: userPublicSelect });
  res.json(user);
}));

export default router;
