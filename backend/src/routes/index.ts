import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import authRoutes from './auth.routes';
import settingsRoutes from './settings.routes';
import courseRoutes from './courses.routes';
import taskRoutes from './tasks.routes';
import sessionRoutes from './sessions.routes';
import pomodoroRoutes from './pomodoro.routes';
import dashboardRoutes from './dashboard.routes';
import calendarRoutes from './calendar.routes';
import schedulerRoutes from './scheduler.routes';
import analyticsRoutes from './analytics.routes';
import notificationRoutes from './notifications.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/settings', requireAuth, settingsRoutes);
router.use('/courses', requireAuth, courseRoutes);
router.use('/tasks', requireAuth, taskRoutes);
router.use('/sessions', requireAuth, sessionRoutes);
router.use('/pomodoro', requireAuth, pomodoroRoutes);
router.use('/dashboard', requireAuth, dashboardRoutes);
router.use('/calendar', requireAuth, calendarRoutes);
router.use('/scheduler', requireAuth, schedulerRoutes);
router.use('/analytics', requireAuth, analyticsRoutes);
router.use('/notifications', requireAuth, notificationRoutes);

export default router;
