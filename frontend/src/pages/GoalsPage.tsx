import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, settingsApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/ui/Field';

export function GoalsPage() {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: dashboard } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });

  const [goals, setGoals] = useState({ hours: 20, tasks: 5, streak: 7 });

  useEffect(() => {
    if (settings) setGoals(settings.goals);
  }, [settings]);

  const saveGoals = async () => {
    const updated = await settingsApi.updateGoals(goals);
    setUser(updated);
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return (
    <div className="animate-sp-rise">
      <h1 className="m-0 mb-8 font-heading font-medium text-[28px] tracking-tight">Goals</h1>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="card p-6">
          <div className="font-heading text-[15px] mb-6">This week's progress</div>
          <div className="flex flex-col gap-6">
            {dashboard?.goalProgress.map(g => (
              <div key={g.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px]">{g.label}</span>
                  <span className="text-[13px]" style={{ color: g.pct >= 100 ? 'var(--color-accent-300)' : 'var(--color-neutral-400)' }}>{g.value}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${g.pct}%`, background: g.pct >= 100 ? 'var(--color-accent-400)' : 'var(--color-accent-600)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="font-heading text-[15px] mb-6">Targets</div>
          <div className="flex flex-col gap-4">
            <Field label="Weekly study hours target">
              <input className="input" type="number" min={1} max={80} value={goals.hours} onChange={e => setGoals(g => ({ ...g, hours: Number(e.target.value) }))} onBlur={saveGoals} />
            </Field>
            <Field label="Assignments per week">
              <input className="input" type="number" min={1} max={30} value={goals.tasks} onChange={e => setGoals(g => ({ ...g, tasks: Number(e.target.value) }))} onBlur={saveGoals} />
            </Field>
            <Field label="Streak target (days)">
              <input className="input" type="number" min={1} max={60} value={goals.streak} onChange={e => setGoals(g => ({ ...g, streak: Number(e.target.value) }))} onBlur={saveGoals} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
