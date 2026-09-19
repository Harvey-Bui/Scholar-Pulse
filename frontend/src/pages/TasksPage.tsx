import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, PencilSimple, Trash, CheckCircle, FileText, PencilLine, Stack, Question, GraduationCap } from '@phosphor-icons/react';
import { coursesApi, tasksApi, type TaskFilters } from '../api/resources';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Tag } from '../components/ui/Tag';
import { TaskModal } from '../components/tasks/TaskModal';
import { dayDiff, dueColor, formatDateLabel, fmtMinutes } from '../utils/format';
import type { Task, TaskType } from '../api/types';

const TYPE_ICONS: Record<TaskType, typeof FileText> = {
  ASSIGNMENT: FileText, HOMEWORK: PencilLine, PROJECT: Stack, QUIZ: Question, EXAM: GraduationCap,
};

export function TasksPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TaskFilters>({ course: 'all', type: 'all', priority: 'all', status: 'open', sort: 'due' });
  const [modalTask, setModalTask] = useState<Task | 'new' | null>(null);

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: coursesApi.list });
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks', filters], queryFn: () => tasksApi.list(filters) });
  const { data: allTasks = [] } = useQuery({ queryKey: ['tasks', 'all'], queryFn: () => tasksApi.list({ status: 'all' }) });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const toggle = async (id: string) => {
    await tasksApi.toggle(id);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await tasksApi.remove(id);
    refresh();
  };

  const openCount = allTasks.filter(t => !t.done).length;

  return (
    <div className="animate-sp-rise">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
        <div>
          <h1 className="m-0 font-heading font-medium text-[28px] tracking-tight">Tasks</h1>
          <p className="mt-2 text-neutral-400">{tasks.length} shown · {openCount} open of {allTasks.length} total</p>
        </div>
        <Button variant="primary" onClick={() => setModalTask('new')}>
          <Plus size={16} /> New task
        </Button>
      </div>

      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <label className="field block">
          <span>Course</span>
          <select className="input" value={filters.course} onChange={e => setFilters(f => ({ ...f, course: e.target.value }))}>
            <option value="all">All courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </label>
        <label className="field block">
          <span>Type</span>
          <select className="input" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="all">All types</option>
            {(['ASSIGNMENT', 'HOMEWORK', 'PROJECT', 'QUIZ', 'EXAM'] as TaskType[]).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="field block">
          <span>Priority</span>
          <select className="input" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="all">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </label>
        <label className="field block">
          <span>Status</span>
          <select className="input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="open">Open</option>
            <option value="done">Completed</option>
            <option value="all">All</option>
          </select>
        </label>
        <label className="field block">
          <span>Sort by</span>
          <select className="input" value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}>
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
            <option value="est">Study time</option>
            <option value="title">Title</option>
          </select>
        </label>
      </div>

      <div className="card px-6 pb-6 pt-3">
        {isLoading && <div className="text-neutral-500 py-6 text-center">Loading…</div>}
        {tasks.map(t => {
          const n = dayDiff(t.dueDate);
          const Icon = TYPE_ICONS[t.type];
          return (
            <div key={t.id} className="flex flex-wrap items-center gap-4 py-4 border-b border-divider last:border-0">
              <button
                type="button"
                aria-label="Toggle complete"
                onClick={() => toggle(t.id)}
                className="grid place-items-center flex-none w-5 h-5 rounded-sm cursor-pointer text-accent-100"
                style={{
                  background: t.done ? 'var(--color-accent-600)' : 'transparent',
                  border: `1px solid ${t.done ? 'var(--color-accent-600)' : 'var(--color-neutral-700)'}`,
                }}
              >
                {t.done && <CheckCircle size={12} weight="fill" />}
              </button>
              <div className="flex-1 min-w-[220px]">
                <div
                  className="flex items-center gap-2"
                  style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--color-neutral-600)' : 'var(--color-text)' }}
                >
                  <Icon size={14} className="text-neutral-500" />
                  {t.title}
                </div>
                {t.description && <div className="text-neutral-500 text-xs mt-0.5">{t.description}</div>}
              </div>
              <span className="flex-none text-xs" style={{ color: t.course?.color ?? 'var(--color-neutral-500)' }}>
                {t.course?.code ?? 'Unassigned'}
              </span>
              <Tag variant={t.priority === 'HIGH' ? 'accent' : t.priority === 'MEDIUM' ? 'accent2' : 'neutral'}>{t.priority}</Tag>
              <span className="flex-none w-24 text-xs" style={{ color: dueColor(n, t.done) }}>{formatDateLabel(t.dueDate)}</span>
              <span className="flex-none w-14 text-neutral-500 text-xs">{fmtMinutes(t.estimatedMin)}</span>
              <div className="flex gap-1 flex-none">
                <IconButton label="Edit task" onClick={() => setModalTask(t)}>
                  <PencilSimple size={14} />
                </IconButton>
                <IconButton label="Delete task" onClick={() => remove(t.id)}>
                  <Trash size={14} />
                </IconButton>
              </div>
            </div>
          );
        })}
        {!isLoading && tasks.length === 0 && (
          <div className="p-8 text-center text-neutral-500 text-sm">No tasks match these filters.</div>
        )}
      </div>

      {modalTask && (
        <TaskModal
          task={modalTask === 'new' ? undefined : modalTask}
          onClose={() => setModalTask(null)}
          onSaved={() => {
            setModalTask(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
