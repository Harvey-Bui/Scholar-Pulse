import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const courseSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(40),
  instructor: z.string().max(200).optional(),
  semester: z.string().max(60).optional(),
  credits: z.number().int().min(0).max(20).default(3),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

router.get('/', asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'asc' } });
  res.json(courses);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = courseSchema.parse(req.body);
  const course = await prisma.course.create({ data: { ...data, userId: req.userId! } });
  res.status(201).json(course);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const course = await prisma.course.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!course) throw new AppError(404, 'Course not found');
  res.json(course);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const data = courseSchema.partial().parse(req.body);
  const existing = await prisma.course.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError(404, 'Course not found');
  const course = await prisma.course.update({ where: { id: existing.id }, data });
  res.json(course);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await prisma.course.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) throw new AppError(404, 'Course not found');
  await prisma.course.delete({ where: { id: existing.id } });
  res.status(204).end();
}));

export default router;
