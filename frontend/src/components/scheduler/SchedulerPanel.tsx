import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MagicWand, X } from '@phosphor-icons/react';
import { schedulerApi, tasksApi } from '../../api/resources';
import type { SuggestResult } from '../../api/types';
import { Button } from '../ui/Button';
import { fmtHours } from '../../utils/format';

export function SchedulerPanel({ onClose, onAccepted }: { onClose: () => void; onAccepted: () => void }) {
  const queryClient = useQueryClient();
  const { data: openTasks = [] } = useQuery({ queryKey: ['tasks', 'open'], queryFn: () => tasksApi.list({ status: 'open' }) });

  const [horizonDays, setHorizonDays] = useState(14);
  const [result, setResult] = useState<SuggestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const taskById = new Map(openTasks.map(t => [t.id, t]));

  const runSuggest = async () => {
    setLoading(true);
    setResult(null);
    try {
      setResult(await schedulerApi.suggest({ horizonDays }));
    } finally {
      setLoading(false);
    }
  };

  const acceptAll = async () => {
    if (!result || result.proposals.length === 0) return;
    setAccepting(true);
    try {
      await schedulerApi.accept(result.proposals.map(p => ({ courseId: p.courseId, startAt: p.startAt, endAt: p.endAt, notes: 'Scheduled automatically' })));
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onAccepted();
    } finally {
      setAccepting(false);
    }
  };

  const totalMin = result?.proposals.reduce((a, p) => a + (new Date(p.endAt).getTime() - new Date(p.startAt).getTime()) / 60000, 0) ?? 0;

  return (
    <div className="dialog-backdrop animate-sp-fade" style={{ zIndex: 30 }}>
      <div className="dialog w-full" style={{ maxWidth: 560, maxHeight: '86vh', overflow: 'auto', padding: 'var(--space-8)' }}>
        <div className="flex items-center justify-between gap-4 font-heading text-xl">
          <span className="flex items-center gap-2"><MagicWand size={20} /> Smart scheduler</span>
          <button type="button" aria-label="Close" onClick={onClose} className="grid place-items-center w-[30px] h-[30px] rounded-sm border border-divider text-neutral-400 cursor-pointer hover:text-accent-300">
            <X size={14} />
          </button>
        </div>

        <p className="text-neutral-400 text-sm mt-3">
          Fills your free time (set on the Settings page) with your {openTasks.length} open task{openTasks.length === 1 ? '' : 's'},
          earliest due date first, skipping times you're already busy.
        </p>

        <div className="flex items-end gap-3 mt-4">
          <label className="field block flex-1">
            <span>Look ahead (days)</span>
            <input className="input" type="number" min={1} max={60} value={horizonDays} onChange={e => setHorizonDays(Number(e.target.value))} />
          </label>
          <Button variant="primary" onClick={runSuggest} disabled={loading}>{loading ? 'Thinking…' : 'Suggest sessions'}</Button>
        </div>

        {result && (
          <div className="mt-6">
            <div className="text-sm text-neutral-400 mb-3">
              {result.proposals.length} session{result.proposals.length === 1 ? '' : 's'} proposed · {fmtHours(totalMin / 60)} total
              {result.unscheduled.length > 0 && (
                <span className="text-accent-400"> · {result.unscheduled.length} task{result.unscheduled.length === 1 ? '' : 's'} couldn't fit in your availability</span>
              )}
            </div>
            <div className="flex flex-col gap-2 max-h-64 overflow-auto">
              {result.proposals.map((p, i) => {
                const task = taskById.get(p.taskId);
                return (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-md border border-divider text-sm">
                    <span className="flex-none w-2 h-8 rounded-sm" style={{ background: task?.course?.color ?? 'var(--color-neutral-600)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{task?.title ?? 'Task'}</div>
                      <div className="text-neutral-500 text-xs">
                        {new Date(p.startAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        {' – '}
                        {new Date(p.endAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {result.proposals.length === 0 && (
                <div className="text-center text-neutral-500 text-sm py-4">No availability windows are set — add some on the Settings page.</div>
              )}
            </div>
            {result.proposals.length > 0 && (
              <Button variant="primary" className="w-full justify-center mt-4" onClick={acceptAll} disabled={accepting}>
                {accepting ? 'Adding…' : `Accept all ${result.proposals.length} sessions`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
