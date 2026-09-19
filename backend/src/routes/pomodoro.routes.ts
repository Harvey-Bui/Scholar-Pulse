import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

const completeSchema = z.object({
  startedAt: z.string().datetime(),
  workMinutes: z.number().int().min(1).max(180),
});

router.post('/complete', asyncHandler(async (req, res) => {
  const data = completeSchema.parse(req.body);
  const pomodoro = await prisma.pomodoroSession.create({
    data: {
      userId: req.userId!,
      startedAt: new Date(data.startedAt),
      completedAt: new Date(),
      workMinutes: data.workMinutes,
    },
  });
  res.status(201).json(pomodoro);
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const [count, sum] = await Promise.all([
    prisma.pomodoroSession.count({ where: { userId: req.userId } }),
    prisma.pomodoroSession.aggregate({ where: { userId: req.userId }, _sum: { workMinutes: true } }),
  ]);
  res.json({ completedCount: count, totalMinutes: sum._sum.workMinutes || 0 });
}));

export default router;
