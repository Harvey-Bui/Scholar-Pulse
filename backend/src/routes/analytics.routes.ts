import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { getSummary, getCourseBreakdown } from '../services/analytics.service';

const router = Router();

router.get('/summary', asyncHandler(async (req, res) => {
  const { range } = z.object({ range: z.enum(['week', 'month', 'semester']).default('week') }).parse(req.query);
  res.json(await getSummary(req.userId!, range));
}));

router.get('/courses', asyncHandler(async (req, res) => {
  res.json(await getCourseBreakdown(req.userId!));
}));

export default router;
