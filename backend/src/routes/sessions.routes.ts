import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const sessionBase = z.object({
  courseId: z.string().nullable().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
});

const sessionCreateSchema = sessionBase.refine(d => new Date(d.endAt) > new Date(d.startAt), {
  message: 'endAt must be after startAt',
  path: ['endAt'],
});
const sessionUpdateSchema = sessionBase.partial();

router.get('/', asyncHandler(async (req, res) => {
  const { from, to } = req.query as Record<string, string>;
  const sessions = await prisma.studySession.findMany({
    where: {
      userId: req.userId,
      ...(from ? { startAt: { gte: new Date(from) } } : {}),
      ...(to ? { endAt: { lte: new Date(to) } } : {}),
    },
    include: { course: true },
    orderBy: { startAt: 'desc' },
  });
  res.json(sessions);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = sessionCreateSchema.parse(req.body);
  const session = await prisma.studySession.create({
    data: { ...data, startAt: new Date(data.startAt), endAt: new Date(data.endAt), userId: req.userId! },
  });
  res.status(201).json(session);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const session = await prisma.studySession.findFirst({ where: { id: req.params.id, userId: req.userId }, include: { course: true } });
  if (!session) throw new AppError(404, 'Session not found');
  res.json(session);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const data = sessionUpdateSchema.parse(req.body);
  const existing = await prisma.studySession.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError(404, 'Session not found');

  const nextStart = data.startAt ? new Date(data.startAt) : existing.startAt;
  const nextEnd = data.endAt ? new Date(data.endAt) : existing.endAt;
  if (nextEnd <= nextStart) throw new AppError(400, 'endAt must be after startAt');

  const session = await prisma.studySession.update({
    where: { id: existing.id },
    data: { ...data, startAt: nextStart, endAt: nextEnd },
  });
  res.json(session);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.studySession.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError(404, 'Session not found');
  await prisma.studySession.delete({ where: { id: existing.id } });
  res.status(204).end();
}));

export default router;
