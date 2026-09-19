import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { toDbDate, dbDateIso, todayIso } from '../utils/date';

const router = Router();

const TYPE_VALUES = ['ASSIGNMENT', 'HOMEWORK', 'PROJECT', 'QUIZ', 'EXAM'];
const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH'];
const PRIORITY_RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  estimatedMin: z.number().int().min(0).max(1440).default(60),
  type: z.enum(['ASSIGNMENT', 'HOMEWORK', 'PROJECT', 'QUIZ', 'EXAM']).default('ASSIGNMENT'),
  courseId: z.string().nullable().optional(),
});

function serializeTask<T extends { dueDate: Date; doneAt: Date | null }>(t: T) {
  return { ...t, dueDate: dbDateIso(t.dueDate), doneAt: t.doneAt ? dbDateIso(t.doneAt) : null };
}

router.get('/', asyncHandler(async (req, res) => {
  const { course, type, priority, status = 'open', sort = 'due' } = req.query as Record<string, string>;

  const tasks = await prisma.task.findMany({
    where: {
      userId: req.userId,
      ...(course && course !== 'all' ? { courseId: course } : {}),
      ...(type && TYPE_VALUES.includes(type) ? { type: type as any } : {}),
      ...(priority && PRIORITY_VALUES.includes(priority) ? { priority: priority as any } : {}),
      ...(status === 'open' ? { done: false } : status === 'done' ? { done: true } : {}),
    },
    include: { course: true },
  });

  tasks.sort((a, b) => {
    if (sort === 'priority') return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.dueDate.getTime() - b.dueDate.getTime();
    if (sort === 'est') return b.estimatedMin - a.estimatedMin;
    if (sort === 'title') return a.title.localeCompare(b.title);
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  res.json(tasks.map(serializeTask));
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = taskSchema.parse(req.body);
  const task = await prisma.task.create({
    data: { ...data, dueDate: toDbDate(data.dueDate), userId: req.userId! },
  });
  res.status(201).json(serializeTask(task));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const task = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId }, include: { course: true } });
  if (!task) throw new AppError(404, 'Task not found');
  res.json(serializeTask(task));
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const data = taskSchema.partial().parse(req.body);
  const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError(404, 'Task not found');

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: { ...data, ...(data.dueDate ? { dueDate: toDbDate(data.dueDate) } : {}) },
  });
  res.json(serializeTask(task));
}));

router.patch('/:id/toggle', asyncHandler(async (req, res) => {
  const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError(404, 'Task not found');

  const done = !existing.done;
  const task = await prisma.task.update({
    where: { id: existing.id },
    data: { done, doneAt: done ? toDbDate(todayIso()) : null },
  });
  res.json(serializeTask(task));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError(404, 'Task not found');
  await prisma.task.delete({ where: { id: existing.id } });
  res.status(204).end();
}));

export default router;
