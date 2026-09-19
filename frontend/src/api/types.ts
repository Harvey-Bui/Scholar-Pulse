export type Theme = 'DAY' | 'NIGHT';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskType = 'ASSIGNMENT' | 'HOMEWORK' | 'PROJECT' | 'QUIZ' | 'EXAM';
export type NotificationType = 'TASK_DUE_SOON' | 'EXAM_REMINDER' | 'SESSION_REMINDER' | 'GOAL_PROGRESS' | 'STREAK_RISK';

export interface User {
  id: string;
  email: string;
  name: string;
  program: string | null;
  currentSemester: string | null;
  theme: Theme;
  goalWeeklyHours: number;
  goalWeeklyTasks: number;
  goalStreakDays: number;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string | null;
  semester: string | null;
  credits: number;
  color: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  priority: Priority;
  estimatedMin: number;
  type: TaskType;
  done: boolean;
  doneAt: string | null;
  courseId: string | null;
  course: Course | null;
}

export interface StudySession {
  id: string;
  courseId: string | null;
  course: Course | null;
  startAt: string;
  endAt: string;
  notes: string | null;
}

export interface DashboardTaskDto {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  type: TaskType;
  done: boolean;
  estimatedMin: number;
  dueDate: string;
  dayDiff: number;
  course: { id: string; code: string; name: string; color: string } | null;
}

export interface Dashboard {
  profileName: string;
  theme: Theme;
  goals: { hours: number; tasks: number; streak: number };
  stats: {
    weekHours: number;
    weekHoursLabel: string;
    weekTasksDone: number;
    streak: number;
    upcomingExamsCount: number;
    nextExamDayDiff: number | null;
  };
  weeklyGoalPct: number;
  weekBars: { date: string; isToday: boolean; hours: number; heightPct: number }[];
  todayTasks: DashboardTaskDto[];
  openTodayCount: number;
  upcomingDeadlines: DashboardTaskDto[];
  goalProgress: { key: string; label: string; value: string; pct: number }[];
}

export interface Settings {
  profile: { name: string; email: string; program: string | null; semester: string | null };
  goals: { hours: number; tasks: number; streak: number };
  pomodoroConfig: { work: number; break: number };
  theme: Theme;
}

export interface AvailabilityWindow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ScheduleProposal {
  taskId: string;
  courseId: string | null;
  startAt: string;
  endAt: string;
}

export interface SuggestResult {
  proposals: ScheduleProposal[];
  unscheduled: { taskId: string; remainingMin: number }[];
}

export interface AnalyticsSummary {
  range: 'week' | 'month' | 'semester';
  trend: { date: string; hours: number }[];
  totalHours: number;
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;
  hoursByCourse: Record<string, number>;
}

export interface CourseBreakdown {
  id: string;
  name: string;
  code: string;
  credits: number;
  color: string;
  hoursStudied: number;
  openTasks: number;
}

export interface CalendarDay {
  tasks: { id: string; title: string; type: TaskType; done: boolean; course: { code: string; color: string } | null }[];
  sessions: { id: string; startAt: string; endAt: string; course: { code: string; color: string } | null }[];
}

export interface CalendarResponse {
  view: 'month' | 'week';
  rangeStart: string;
  rangeEnd: string;
  days: Record<string, CalendarDay>;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  taskId: string | null;
  sessionId: string | null;
  readAt: string | null;
  createdAt: string;
}
