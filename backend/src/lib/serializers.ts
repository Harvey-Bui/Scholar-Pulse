// Shared Prisma `select` for User so passwordHash never leaves this layer.
export const userPublicSelect = {
  id: true,
  email: true,
  name: true,
  program: true,
  currentSemester: true,
  theme: true,
  goalWeeklyHours: true,
  goalWeeklyTasks: true,
  goalStreakDays: true,
  pomodoroWorkMinutes: true,
  pomodoroBreakMinutes: true,
  createdAt: true,
} as const;
