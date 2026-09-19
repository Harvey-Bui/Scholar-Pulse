import { apiFetch } from './client';
import type {
  AnalyticsSummary, AppNotification, AvailabilityWindow, CalendarResponse, Course, CourseBreakdown,
  Dashboard, Settings, StudySession, SuggestResult, Task, User,
} from './types';

export const coursesApi = {
  list: () => apiFetch<Course[]>('/courses'),
  create: (data: Partial<Course>) => apiFetch<Course>('/courses', { method: 'POST', body: data }),
  update: (id: string, data: Partial<Course>) => apiFetch<Course>(`/courses/${id}`, { method: 'PATCH', body: data }),
  remove: (id: string) => apiFetch<void>(`/courses/${id}`, { method: 'DELETE' }),
};

export interface TaskFilters {
  course?: string;
  type?: string;
  priority?: string;
  status?: string;
  sort?: string;
  [key: string]: string | undefined;
}

export const tasksApi = {
  list: (filters: TaskFilters) => apiFetch<Task[]>('/tasks', { query: filters }),
  create: (data: Partial<Task>) => apiFetch<Task>('/tasks', { method: 'POST', body: data }),
  update: (id: string, data: Partial<Task>) => apiFetch<Task>(`/tasks/${id}`, { method: 'PATCH', body: data }),
  toggle: (id: string) => apiFetch<Task>(`/tasks/${id}/toggle`, { method: 'PATCH' }),
  remove: (id: string) => apiFetch<void>(`/tasks/${id}`, { method: 'DELETE' }),
};

export const sessionsApi = {
  list: (params?: { from?: string; to?: string }) => apiFetch<StudySession[]>('/sessions', { query: params }),
  create: (data: Partial<StudySession>) => apiFetch<StudySession>('/sessions', { method: 'POST', body: data }),
  update: (id: string, data: Partial<StudySession>) => apiFetch<StudySession>(`/sessions/${id}`, { method: 'PATCH', body: data }),
  remove: (id: string) => apiFetch<void>(`/sessions/${id}`, { method: 'DELETE' }),
};

export const dashboardApi = {
  get: () => apiFetch<Dashboard>('/dashboard'),
};

export const settingsApi = {
  get: () => apiFetch<Settings>('/settings'),
  updateProfile: (data: { name?: string; program?: string; semester?: string }) =>
    apiFetch<User>('/settings/profile', { method: 'PATCH', body: data }),
  updateGoals: (data: { hours?: number; tasks?: number; streak?: number }) =>
    apiFetch<User>('/settings/goals', { method: 'PATCH', body: data }),
  updatePomodoro: (data: { work?: number; break?: number }) =>
    apiFetch<User>('/settings/pomodoro', { method: 'PATCH', body: data }),
  updateTheme: (theme: 'DAY' | 'NIGHT') => apiFetch<User>('/settings/theme', { method: 'PATCH', body: { theme } }),
};

export const pomodoroApi = {
  complete: (startedAt: string, workMinutes: number) =>
    apiFetch<void>('/pomodoro/complete', { method: 'POST', body: { startedAt, workMinutes } }),
};

export const calendarApi = {
  get: (view: 'month' | 'week', date: string) => apiFetch<CalendarResponse>('/calendar', { query: { view, date } }),
};

export const schedulerApi = {
  getAvailability: () => apiFetch<AvailabilityWindow[]>('/scheduler/availability'),
  setAvailability: (windows: { dayOfWeek: number; startTime: string; endTime: string }[]) =>
    apiFetch<AvailabilityWindow[]>('/scheduler/availability', { method: 'PUT', body: windows }),
  suggest: (opts: { taskIds?: string[]; horizonDays?: number }) =>
    apiFetch<SuggestResult>('/scheduler/suggest', { method: 'POST', body: opts }),
  accept: (sessions: { courseId?: string | null; startAt: string; endAt: string; notes?: string }[]) =>
    apiFetch<{ created: number }>('/scheduler/accept', { method: 'POST', body: { sessions } }),
};

export const analyticsApi = {
  summary: (range: 'week' | 'month' | 'semester') => apiFetch<AnalyticsSummary>('/analytics/summary', { query: { range } }),
  courses: () => apiFetch<CourseBreakdown[]>('/analytics/courses'),
};

export const notificationsApi = {
  list: (unread?: boolean) => apiFetch<AppNotification[]>('/notifications', { query: { unread } }),
  markRead: (id: string) => apiFetch<AppNotification>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiFetch<void>('/notifications/read-all', { method: 'POST' }),
};
