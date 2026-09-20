import { Router } from 'express';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/asyncHandler';
import { generateNotificationsForAllUsers } from '../services/notifications.service';

const router = Router();

// Triggered by Vercel Cron (GET request), not by a logged-in user — verified
// via a shared secret instead of the JWT cookie auth every other route uses.
// Vercel automatically sends `Authorization: Bearer $CRON_SECRET` when the
// CRON_SECRET env var is set on the project.
router.get('/notifications', asyncHandler(async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    throw new AppError(401, 'Unauthorized');
  }
  await generateNotificationsForAllUsers();
  res.json({ ok: true });
}));

export default router;
