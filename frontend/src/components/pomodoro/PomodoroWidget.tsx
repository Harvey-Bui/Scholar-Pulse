import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from '@phosphor-icons/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi, pomodoroApi } from '../../api/resources';
import { Button } from '../ui/Button';

type Phase = 'work' | 'break';

export function PomodoroWidget() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });

  const workMin = settings?.pomodoroConfig.work ?? 25;
  const breakMin = settings?.pomodoroConfig.break ?? 5;

  const [phase, setPhase] = useState<Phase>('work');
  const [remaining, setRemaining] = useState(workMin * 60);
  const [running, setRunning] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const initialized = useRef(false);

  // Sync the clock to the server-configured lengths only until the user has
  // interacted, so an in-progress timer doesn't jump if settings refetch.
  useEffect(() => {
    if (!initialized.current && settings) {
      setRemaining(workMin * 60);
      initialized.current = true;
    }
  }, [settings, workMin]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining(r => {
        if (r > 1) return r - 1;
        if (phase === 'work') {
          if (sessionStartedAt) {
            pomodoroApi.complete(sessionStartedAt, workMin).then(() => {
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            });
          }
          setPhase('break');
          return breakMin * 60;
        }
        setPhase('work');
        setRunning(false);
        return workMin * 60;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase, workMin, breakMin, sessionStartedAt, queryClient]);

  const toggle = () => {
    if (!running && phase === 'work') setSessionStartedAt(new Date().toISOString());
    setRunning(r => !r);
  };

  const reset = () => {
    setRunning(false);
    setPhase('work');
    setRemaining(workMin * 60);
  };

  const skip = () => {
    if (phase === 'work') {
      setPhase('break');
      setRemaining(breakMin * 60);
    } else {
      setPhase('work');
      setRemaining(workMin * 60);
    }
    setRunning(false);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div className="card p-6 mt-6">
      <div className="grid gap-8 items-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div>
          <div className="text-neutral-500 text-xs uppercase tracking-wider">Focus timer</div>
          <div
            className="font-heading font-medium mt-2"
            style={{ fontSize: 56, letterSpacing: '-0.03em', lineHeight: 1.05, color: running ? 'var(--color-accent-300)' : 'var(--color-text)' }}
          >
            {mm}:{ss}
          </div>
          <div className="text-neutral-400 mt-2">{phase === 'work' ? 'Work interval' : 'Break'}</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={toggle}>
            {running ? <Pause size={16} /> : <Play size={16} />} {running ? 'Pause' : 'Start'}
          </Button>
          <Button variant="ghost" onClick={reset}>Reset</Button>
          <Button variant="ghost" onClick={skip}>Skip phase</Button>
        </div>
        <div className="text-neutral-500 text-xs">
          {workMin} minutes on, {breakMin} off. Adjust both in Settings.
        </div>
      </div>
    </div>
  );
}
