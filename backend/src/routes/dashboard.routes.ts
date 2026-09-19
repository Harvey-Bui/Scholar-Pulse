import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { getDashboard } from '../services/dashboard.service';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(await getDashboard(req.userId!));
}));

export default router;
