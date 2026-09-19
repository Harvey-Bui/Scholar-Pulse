import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CaretLeft, CaretRight, MagicWand } from '@phosphor-icons/react';
import { calendarApi } from '../api/resources';
import { Button } from '../components/ui/Button';
import { SchedulerPanel } from '../components/scheduler/SchedulerPanel';
import { formatTimeLabel } from '../utils/format';

type View = 'month' | 'week';

function isoOf(d: Date): string {
  return d.toLocaleDateString('en-CA');
}

export function CalendarPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>('month');
  const [anchor, setAnchor] = useState(new Date());
  const [schedulerOpen, setSchedulerOpen] = useState(false);

  const anchorIso = isoOf(anchor);
  const { data } = useQuery({ queryKey: ['calendar', view, anchorIso], queryFn: () => calendarApi.get(view, anchorIso) });

  const shift = (delta: number) => {
    const d = new Date(anchor);
    if (view === 'month') d.setMonth(d.getMonth() + delta);
    else d.setDate(d.getDate() + delta * 7);
    setAnchor(d);
  };

  const cells: { date: Date; iso: string; inRange: boolean }[] = [];
  if (view === 'month') {
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const offset = (monthStart.getDay() + 6) % 7;
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - offset);
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      cells.push({ date: d, iso: isoOf(d), inRange: d.getMonth() === anchor.getMonth() });
    }
  } else if (data) {
    const start = new Date(`${data.rangeStart}T00:00:00`);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      cells.push({ date: d, iso: isoOf(d), inRange: true });
    }
  }

  const today = isoOf(new Date());
  const title = view === 'month'
    ? anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : data
      ? `${new Date(`${data.rangeStart}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(`${data.rangeEnd}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : '';

  return (
    <div className="animate-sp-rise">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
        <div>
          <h1 className="m-0 font-heading font-medium text-[28px] tracking-tight">Calendar</h1>
          <p className="mt-2 text-neutral-400">{title}</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex rounded-md border border-divider overflow-hidden">
            {(['month', 'week'] as View[]).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className="px-3 py-1.5 text-[13px] cursor-pointer capitalize"
                style={{
                  background: view === v ? 'var(--color-accent-900)' : 'transparent',
                  color: view === v ? 'var(--color-accent-200)' : 'var(--color-neutral-400)',
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <IconNavButton onClick={() => shift(-1)}><CaretLeft size={14} /></IconNavButton>
          <Button variant="secondary" onClick={() => setAnchor(new Date())}>Today</Button>
          <IconNavButton onClick={() => shift(1)}><CaretRight size={14} /></IconNavButton>
          <Button variant="primary" onClick={() => setSchedulerOpen(true)}>
            <MagicWand size={16} /> Smart schedule
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-neutral-600 text-[11px] uppercase tracking-wider text-center py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map(cell => {
          const day = data?.days[cell.iso];
          const isToday = cell.iso === today;
          return (
            <div
              key={cell.iso}
              className="rounded-md p-2 flex flex-col gap-1"
              style={{
                minHeight: view === 'month' ? 96 : 160,
                border: `1px solid ${isToday ? 'var(--color-accent-700)' : 'var(--color-divider)'}`,
                background: isToday ? 'var(--color-accent-900)' : 'transparent',
                opacity: cell.inRange ? 1 : 0.4,
              }}
            >
              <div className="text-[12px] font-heading" style={{ color: isToday ? 'var(--color-accent-300)' : 'var(--color-neutral-400)' }}>
                {cell.date.getDate()}
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {(day?.sessions ?? []).slice(0, 3).map(s => (
                  <div key={s.id} className="rounded-sm text-[10px] leading-tight bg-neutral-900 px-1 py-0.5 truncate" style={{ borderLeft: `2px solid ${s.course?.color ?? 'var(--color-neutral-600)'}` }}>
                    {formatTimeLabel(s.startAt)} {s.course?.code ?? ''}
                  </div>
                ))}
                {(day?.tasks ?? []).slice(0, 3).map(t => (
                  <div
                    key={t.id}
                    className="rounded-sm text-[10px] leading-tight px-1 py-0.5 truncate"
                    style={{ borderLeft: `2px solid ${t.course?.color ?? 'var(--color-neutral-600)'}`, background: t.done ? 'transparent' : 'var(--color-neutral-900)', textDecoration: t.done ? 'line-through' : 'none' }}
                  >
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {schedulerOpen && (
        <SchedulerPanel
          onClose={() => setSchedulerOpen(false)}
          onAccepted={() => {
            setSchedulerOpen(false);
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
          }}
        />
      )}
    </div>
  );
}

function IconNavButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid place-items-center w-9 h-9 rounded-md bg-transparent text-neutral-400 border border-divider cursor-pointer hover:text-accent-300 hover:border-accent-700"
    >
      {children}
    </button>
  );
}
