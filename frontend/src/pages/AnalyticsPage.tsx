import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/resources';
import { TrendChart } from '../components/analytics/TrendChart';
import { fmtHours } from '../utils/format';

type Range = 'week' | 'month' | 'semester';
const RANGES: { key: Range; label: string }[] = [
  { key: 'week', label: '7 days' },
  { key: 'month', label: '30 days' },
  { key: 'semester', label: '120 days' },
];

export function AnalyticsPage() {
  const [range, setRange] = useState<Range>('week');
  const { data: summary } = useQuery({ queryKey: ['analytics', 'summary', range], queryFn: () => analyticsApi.summary(range) });
  const { data: courses = [] } = useQuery({ queryKey: ['analytics', 'courses'], queryFn: analyticsApi.courses });

  return (
    <div className="animate-sp-rise">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <h1 className="m-0 font-heading font-medium text-[28px] tracking-tight">Analytics</h1>
        <div className="flex gap-2">
          {RANGES.map(r => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className="px-3 py-1.5 rounded-md text-[13px] cursor-pointer border"
              style={{
                background: range === r.key ? 'var(--color-accent-900)' : 'transparent',
                color: range === r.key ? 'var(--color-accent-200)' : 'var(--color-neutral-400)',
                borderColor: range === r.key ? 'var(--color-accent-700)' : 'var(--color-divider)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card p-6 gap-2">
          <div className="text-neutral-500 text-xs uppercase tracking-wider">Total hours</div>
          <div className="font-heading font-medium text-[30px] tracking-tight">{summary ? fmtHours(summary.totalHours) : '—'}</div>
        </div>
        <div className="card p-6 gap-2">
          <div className="text-neutral-500 text-xs uppercase tracking-wider">Tasks completed</div>
          <div className="font-heading font-medium text-[30px] tracking-tight">{summary ? `${summary.tasksCompleted} / ${summary.tasksTotal}` : '—'}</div>
        </div>
        <div className="card p-6 gap-2">
          <div className="text-neutral-500 text-xs uppercase tracking-wider">Completion rate</div>
          <div className="font-heading font-medium text-[30px] tracking-tight">{summary ? `${summary.completionRate}%` : '—'}</div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="font-heading text-[15px] mb-4">Study hours over time</div>
        {summary && <TrendChart data={summary.trend} />}
      </div>

      <div className="card px-6 pb-2 pt-3">
        <div className="font-heading text-[15px] pb-4">Time by course</div>
        {courses.map(c => (
          <div key={c.id} className="flex items-center gap-4 py-3 border-t border-divider">
            <span className="flex-none w-2 h-8 rounded-sm" style={{ background: c.color }} />
            <div className="flex-1 min-w-0">
              <div>{c.code} — {c.name}</div>
              <div className="text-neutral-500 text-xs">{c.credits} credits · {c.openTasks} open tasks</div>
            </div>
            <span className="flex-none font-heading">{fmtHours(c.hoursStudied)}</span>
          </div>
        ))}
        {courses.length === 0 && <div className="p-6 text-center text-neutral-500 text-sm">No courses yet.</div>}
      </div>
    </div>
  );
}
