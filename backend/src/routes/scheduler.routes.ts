import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { suggestSchedule } from '../services/scheduler.service';

const router = Router();

router.get('/availability', asyncHandler(async (req, res) => {
  const windows = await prisma.availabilityWindow.findMany({
    where: { userId: req.userId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
  res.json(windows);
}));

const windowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

router.put('/availability', asyncHandler(async (req, res) => {
  const windows = z.array(windowSchema).parse(req.body);
  await prisma.$transaction([
    prisma.availabilityWindow.deleteMany({ where: { userId: req.userId } }),
    prisma.availabilityWindow.createMany({ data: windows.map(w => ({ ...w, userId: req.userId! })) }),
  ]);
  const updated = await prisma.availabilityWindow.findMany({ where: { userId: req.userId } });
  res.json(updated);
}));

const suggestSchema = z.object({
  taskIds: z.array(z.string()).optional(),
  horizonDays: z.number().int().min(1).max(60).optional(),
});

router.post('/suggest', asyncHandler(async (req, res) => {
  const opts = suggestSchema.parse(req.body);
  res.json(await suggestSchedule(req.userId!, opts));
}));

const acceptSchema = z.object({
  sessions: z.array(z.object({
    courseId: z.string().nullable().optional(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    notes: z.string().max(2000).optional(),
  })).min(1),
});

router.post('/accept', asyncHandler(async (req, res) => {
  const { sessions } = acceptSchema.parse(req.body);
  const created = await prisma.studySession.createMany({
    data: sessions.map(s => ({ ...s, startAt: new Date(s.startAt), endAt: new Date(s.endAt), userId: req.userId! })),
  });
  res.status(201).json({ created: created.count });
}));

export default router;
