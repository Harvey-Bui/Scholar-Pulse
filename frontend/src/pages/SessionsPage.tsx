import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Printer, PencilSimple, Trash } from '@phosphor-icons/react';
import { calendarApi, sessionsApi } from '../api/resources';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Tag } from '../components/ui/Tag';
import { SessionModal } from '../components/sessions/SessionModal';
import { fmtHours, formatDateTimeLabel, formatTimeLabel, sessionHours } from '../utils/format';
import type { StudySession } from '../api/types';

function isoToday(): string {
  return new Date().toLocaleDateString('en-CA');
}

const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function SessionsPage() {
  const queryClient = useQueryClient();
  const [modalSession, setModalSession] = useState<StudySession | 'new' | null>(null);

  const { data: sessions = [], isLoading } = useQuery({ queryKey: ['sessions'], queryFn: () => sessionsApi.list() });
  const { data: week } = useQuery({ queryKey: ['calendar', 'week', isoToday()], queryFn: () => calendarApi.get('week', isoToday()) });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    await sessionsApi.remove(id);
    refresh();
  };

  const totalHours = sessions.reduce((a, s) => a + sessionHours(s.startAt, s.endAt), 0);
  const today = isoToday();

  const weekDays = week
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date(`${week.rangeStart}T00:00:00`);
        d.setDate(d.getDate() + i);
        const key = d.toLocaleDateString('en-CA');
        return { key, date: d, ...week.days[key] };
      })
    : [];

  return (
    <div className="animate-sp-rise">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
        <div>
          <h1 className="m-0 font-heading font-medium text-[28px] tracking-tight">Study sessions</h1>
          <p className="mt-2 text-neutral-400">{fmtHours(totalHours)} logged across {sessions.length} sessions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => window.print()}>
            <Printer size={16} /> Export schedule
          </Button>
          <Button variant="primary" onClick={() => setModalSession('new')}>
            <Plus size={16} /> Log session
          </Button>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <div className="font-heading text-[15px]">This week</div>
          {week && (
            <div className="text-neutral-400 text-[13px]">
              {formatDateTimeLabel(week.rangeStart).replace(/^\w+, /, '')} – {formatDateTimeLabel(week.rangeEnd).replace(/^\w+, /, '')}
            </div>
          )}
        </div>
        <div className="grid grid-cols-7 gap-3 overflow-x-auto">
          {weekDays.map((d, i) => {
            const isToday = d.key === today;
            return (
              <div
                key={d.key}
                className="rounded-md p-3"
                style={{
                  minHeight: 132, minWidth: 98,
                  border: `1px solid ${isToday ? 'var(--color-accent-700)' : 'var(--color-divider)'}`,
                  background: isToday ? 'var(--color-accent-900)' : 'transparent',
                }}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-wider" style={{ color: isToday ? 'var(--color-accent-300)' : 'var(--color-neutral-600)' }}>
                    {WEEKDAY_LABELS[i]}
                  </span>
                  <span className="font-heading text-[13px] text-neutral-400">{d.date.getDate()}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {(d.sessions ?? []).map(s => (
                    <div key={s.id} className="rounded-sm text-[11px] leading-tight bg-neutral-900 px-1.5 py-1" style={{ borderLeft: `2px solid ${s.course?.color ?? 'var(--color-neutral-600)'}` }}>
                      <div className="text-neutral-300 whitespace-nowrap overflow-hidden text-ellipsis">{s.course?.code ?? 'Unassigned'}</div>
                      <div className="text-neutral-600">{formatTimeLabel(s.startAt)}–{formatTimeLabel(s.endAt)}</div>
                    </div>
                  ))}
                  {(d.tasks ?? []).map(t => (
                    <div key={t.id} className="rounded-sm text-[11px] leading-tight bg-neutral-900 px-1.5 py-1" style={{ borderLeft: `2px solid ${t.course?.color ?? 'var(--color-neutral-600)'}` }}>
                      <div className="text-neutral-300 whitespace-nowrap overflow-hidden text-ellipsis">{t.title}</div>
                      <div className="text-neutral-600">{t.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card px-6 pb-6 pt-3">
        <div className="font-heading text-[15px] py-4">Session log</div>
        {isLoading && <div className="text-neutral-500 py-6 text-center">Loading…</div>}
        {sessions.map(s => (
          <div key={s.id} className="flex flex-wrap items-center gap-4 py-4 border-t border-divider">
            <span className="flex-none w-2 h-8 rounded-sm" style={{ background: s.course?.color ?? 'var(--color-neutral-600)' }} />
            <div className="flex-1 min-w-[200px]">
              <div>{s.course ? `${s.course.code} — ${s.course.name}` : 'Unassigned'}</div>
              <div className="text-neutral-500 text-xs">{s.notes || 'No notes'}</div>
            </div>
            <span className="flex-none text-neutral-400 text-[13px]">{formatDateTimeLabel(s.startAt)}</span>
            <span className="flex-none text-neutral-400 text-[13px]">{formatTimeLabel(s.startAt)}–{formatTimeLabel(s.endAt)}</span>
            <Tag variant="accent">{fmtHours(sessionHours(s.startAt, s.endAt))}</Tag>
            <div className="flex gap-1 flex-none">
              <IconButton label="Edit session" onClick={() => setModalSession(s)}>
                <PencilSimple size={14} />
              </IconButton>
              <IconButton label="Delete session" onClick={() => remove(s.id)}>
                <Trash size={14} />
              </IconButton>
            </div>
          </div>
        ))}
        {!isLoading && sessions.length === 0 && (
          <div className="p-8 text-center text-neutral-500 text-sm">No sessions logged yet.</div>
        )}
      </div>

      {modalSession && (
        <SessionModal
          session={modalSession === 'new' ? undefined : modalSession}
          onClose={() => setModalSession(null)}
          onSaved={() => {
            setModalSession(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
