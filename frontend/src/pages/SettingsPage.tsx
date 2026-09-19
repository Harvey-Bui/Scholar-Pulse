import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Printer } from '@phosphor-icons/react';
import { settingsApi, schedulerApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function SettingsPage() {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });
  const { data: availability } = useQuery({ queryKey: ['availability'], queryFn: schedulerApi.getAvailability });

  const [profile, setProfile] = useState({ name: '', program: '', semester: '' });
  const [goals, setGoals] = useState({ hours: 20, tasks: 5, streak: 7 });
  const [pomo, setPomo] = useState({ work: 25, break: 5 });
  const [windows, setWindows] = useState<Record<number, { enabled: boolean; start: string; end: string }>>({});

  useEffect(() => {
    if (settings) {
      setProfile({ name: settings.profile.name, program: settings.profile.program ?? '', semester: settings.profile.semester ?? '' });
      setGoals(settings.goals);
      setPomo(settings.pomodoroConfig);
    }
  }, [settings]);

  useEffect(() => {
    if (availability) {
      const map: Record<number, { enabled: boolean; start: string; end: string }> = {};
      for (let d = 0; d < 7; d++) map[d] = { enabled: false, start: '18:00', end: '21:00' };
      for (const w of availability) map[w.dayOfWeek] = { enabled: true, start: w.startTime, end: w.endTime };
      setWindows(map);
    }
  }, [availability]);

  const saveProfile = async () => {
    const updated = await settingsApi.updateProfile(profile);
    setUser(updated);
  };

  const saveGoals = async () => {
    const updated = await settingsApi.updateGoals(goals);
    setUser(updated);
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const savePomo = async () => {
    const updated = await settingsApi.updatePomodoro(pomo);
    setUser(updated);
  };

  const saveAvailability = async () => {
    const list = Object.entries(windows)
      .filter(([, w]) => w.enabled)
      .map(([day, w]) => ({ dayOfWeek: Number(day), startTime: w.start, endTime: w.end }));
    await schedulerApi.setAvailability(list);
    queryClient.invalidateQueries({ queryKey: ['availability'] });
  };

  return (
    <div className="animate-sp-rise">
      <h1 className="m-0 mb-8 font-heading font-medium text-[28px] tracking-tight">Profile &amp; settings</h1>
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="card p-6">
          <div className="font-heading text-[15px] mb-6">Profile</div>
          <div className="flex flex-col gap-4">
            <Field label="Name">
              <input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} onBlur={saveProfile} />
            </Field>
            <Field label="Email">
              <input className="input" value={settings?.profile.email ?? ''} disabled />
            </Field>
            <Field label="Program">
              <input className="input" value={profile.program} onChange={e => setProfile(p => ({ ...p, program: e.target.value }))} onBlur={saveProfile} />
            </Field>
            <Field label="Current semester">
              <input className="input" value={profile.semester} onChange={e => setProfile(p => ({ ...p, semester: e.target.value }))} onBlur={saveProfile} />
            </Field>
          </div>
        </div>

        <div className="card p-6">
          <div className="font-heading text-[15px] mb-6">Goals</div>
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

        <div className="card p-6">
          <div className="font-heading text-[15px] mb-6">Focus timer</div>
          <div className="flex flex-col gap-4">
            <Field label="Work interval (minutes)">
              <input className="input" type="number" min={5} max={90} value={pomo.work} onChange={e => setPomo(p => ({ ...p, work: Number(e.target.value) }))} onBlur={savePomo} />
            </Field>
            <Field label="Break interval (minutes)">
              <input className="input" type="number" min={1} max={30} value={pomo.break} onChange={e => setPomo(p => ({ ...p, break: Number(e.target.value) }))} onBlur={savePomo} />
            </Field>
          </div>
        </div>

        <div className="card p-6">
          <div className="font-heading text-[15px] mb-2">Weekly availability</div>
          <p className="text-neutral-500 text-xs mb-4">Used by the smart scheduler on the Calendar page to place study sessions.</p>
          <div className="flex flex-col gap-3">
            {DAY_LABELS.map((label, day) => {
              const w = windows[day] ?? { enabled: false, start: '18:00', end: '21:00' };
              return (
                <div key={day} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-28 flex-none text-xs">
                    <input
                      type="checkbox"
                      checked={w.enabled}
                      onChange={e => setWindows(prev => ({ ...prev, [day]: { ...w, enabled: e.target.checked } }))}
                    />
                    {label}
                  </label>
                  <input
                    className="input"
                    type="time"
                    disabled={!w.enabled}
                    value={w.start}
                    onChange={e => setWindows(prev => ({ ...prev, [day]: { ...w, start: e.target.value } }))}
                  />
                  <input
                    className="input"
                    type="time"
                    disabled={!w.enabled}
                    value={w.end}
                    onChange={e => setWindows(prev => ({ ...prev, [day]: { ...w, end: e.target.value } }))}
                  />
                </div>
              );
            })}
          </div>
          <Button variant="secondary" className="mt-4" onClick={saveAvailability}>Save availability</Button>
        </div>

        <div className="card p-6">
          <div className="font-heading text-[15px] mb-6">Data</div>
          <div className="text-neutral-400 text-[13px]">Everything you enter is saved to your account and synced across devices.</div>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button variant="ghost" onClick={() => window.print()}>
              <Printer size={16} /> Export schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
