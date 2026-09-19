import { useQuery } from '@tanstack/react-query';
import { Plus, Clock, CheckCircle, Flame, GraduationCap } from '@phosphor-icons/react';
import { dashboardApi, tasksApi } from '../api/resources';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import { PomodoroWidget } from '../components/pomodoro/PomodoroWidget';
import { countdown } from '../utils/format';
import { useState } from 'react';
import { TaskModal } from '../components/tasks/TaskModal';

const STAT_ICONS = [Clock, CheckCircle, Flame, GraduationCap];

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });

  const toggleTask = async (id: string) => {
    await tasksApi.toggle(id);
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  if (isLoading || !data) return <div className="text-neutral-500">Loading…</div>;

  const hour = new Date().getHours();
  const greeting = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${data.profileName.split(' ')[0]}`;
  const dashLine = data.openTodayCount
    ? `You have ${data.openTodayCount} task${data.openTodayCount === 1 ? '' : 's'} due today and ${data.stats.weekHoursLabel} logged this week. Keep the run going.`
    : `Nothing due today, and ${data.stats.weekHoursLabel} logged this week. Nice work staying ahead.`;

  const stats = [
    { label: 'Hours this week', value: data.stats.weekHoursLabel, note: `Target ${data.goals.hours}h` },
    { label: 'Tasks completed', value: data.stats.weekTasksDone, note: `of ${data.goals.tasks} this week` },
    { label: 'Current streak', value: `${data.stats.streak} ${data.stats.streak === 1 ? 'day' : 'days'}`, note: `Best target ${data.goals.streak} days` },
    {
      label: 'Upcoming exams', value: data.stats.upcomingExamsCount,
      note: data.stats.nextExamDayDiff != null ? `Next: ${countdown(data.stats.nextExamDayDiff)}` : 'None scheduled',
    },
  ];

  return (
    <div className="animate-sp-fade">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="m-0 font-heading font-medium text-[30px] tracking-tight">{greeting}</h1>
          <p className="mt-2 text-neutral-400 max-w-[56ch]">{dashLine}</p>
        </div>
        <Button variant="primary" onClick={() => setTaskModalOpen(true)}>
          <Plus size={16} /> New task
        </Button>
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {stats.map((s, i) => {
          const Icon = STAT_ICONS[i];
          return (
            <div key={s.label} className="card p-6 gap-2">
              <div className="flex items-center gap-2 text-neutral-500 text-xs uppercase tracking-wider">
                <Icon size={14} className="text-accent-400" />
                {s.label}
              </div>
              <div className="font-heading font-medium text-[30px] tracking-tight">{s.value}</div>
              <div className="text-neutral-500 text-xs">{s.note}</div>
            </div>
          );
        })}
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="font-heading text-[15px]">Weekly productivity</div>
          <div className="text-neutral-400 text-[13px]">
            {data.stats.weekHoursLabel} of {data.goals.hours}h — {data.weeklyGoalPct}% of your weekly goal
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-neutral-900 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${data.weeklyGoalPct}%`,
              background: 'linear-gradient(90deg, var(--color-accent-600), var(--color-accent-400))',
              boxShadow: '0 0 18px var(--color-accent-800)',
            }}
          />
        </div>
        <div className="grid grid-cols-7 gap-3 items-end mt-8" style={{ height: 104 }}>
          {data.weekBars.map(b => (
            <div key={b.date} className="flex flex-col justify-end gap-2 h-full text-center">
              <div className="text-neutral-500 text-[11px]">{b.hours || ''}</div>
              <div
                className="rounded-t transition-all"
                style={{
                  height: `${Math.max(3, b.heightPct)}%`,
                  background: b.isToday ? 'var(--color-accent-400)' : b.hours ? 'var(--color-accent-700)' : 'var(--color-neutral-900)',
                }}
              />
              <div className="text-[11px]" style={{ color: b.isToday ? 'var(--color-accent-300)' : 'var(--color-neutral-600)' }}>
                {new Date(`${b.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'narrow' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="card p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div className="font-heading text-[15px]">Today</div>
            <div className="text-neutral-500 text-xs">{data.openTodayCount} open</div>
          </div>
          <div className="flex flex-col gap-2">
            {data.todayTasks.map(t => (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-md border border-divider hover:border-accent-700">
                <button
                  type="button"
                  aria-label="Toggle complete"
                  onClick={() => toggleTask(t.id)}
                  className="grid place-items-center flex-none w-5 h-5 mt-px rounded-sm cursor-pointer text-accent-100"
                  style={{
                    background: t.done ? 'var(--color-accent-600)' : 'transparent',
                    border: `1px solid ${t.done ? 'var(--color-accent-600)' : 'var(--color-neutral-700)'}`,
                  }}
                >
                  {t.done && <CheckCircle size={12} weight="fill" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--color-neutral-600)' : 'var(--color-text)' }}>
                    {t.title}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-0.5 text-neutral-500 text-xs">
                    {t.course && <span style={{ color: t.course.color }}>{t.course.code}</span>}
                    <span>{t.estimatedMin ? `${Math.round((t.estimatedMin / 60) * 10) / 10}h` : '—'}</span>
                    <span>{t.priority}</span>
                  </div>
                </div>
              </div>
            ))}
            {data.todayTasks.length === 0 && (
              <div className="p-6 text-center text-neutral-500 text-sm">Nothing due today. A good day to get ahead.</div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="font-heading text-[15px] mb-4">Upcoming deadlines</div>
          <div className="flex flex-col">
            {data.upcomingDeadlines.map(t => (
              <div key={t.id} className="flex items-center gap-4 py-3 border-b border-divider last:border-0">
                <div className="flex-none w-11 text-center">
                  <div className="font-heading text-base" style={{ color: t.dayDiff <= 1 ? 'var(--color-accent-300)' : 'var(--color-text)' }}>
                    {new Date(`${t.dueDate}T00:00:00`).getDate()}
                  </div>
                  <div className="text-neutral-600 text-[10px] uppercase tracking-wider">
                    {new Date(`${t.dueDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="whitespace-nowrap overflow-hidden text-ellipsis">{t.title}</div>
                  <div className="text-neutral-500 text-xs">
                    {t.course?.code ?? 'Unassigned'} · {t.type}
                  </div>
                </div>
                <Tag variant={t.dayDiff <= 1 ? 'accent' : 'outline'}>{countdown(t.dayDiff)}</Tag>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PomodoroWidget />

      {taskModalOpen && (
        <TaskModal
          onClose={() => setTaskModalOpen(false)}
          onSaved={() => {
            setTaskModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          }}
        />
      )}
    </div>
  );
}
