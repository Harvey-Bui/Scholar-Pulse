import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coursesApi, sessionsApi } from '../../api/resources';
import type { StudySession } from '../../api/types';
import { Modal } from '../ui/Modal';
import { Field } from '../ui/Field';
import { Button } from '../ui/Button';

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultStart(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return toLocalInput(d.toISOString());
}

function defaultEnd(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return toLocalInput(d.toISOString());
}

interface Props {
  session?: StudySession;
  onClose: () => void;
  onSaved: () => void;
}

export function SessionModal({ session, onClose, onSaved }: Props) {
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: coursesApi.list });

  const [courseId, setCourseId] = useState(session?.courseId ?? '');
  const [start, setStart] = useState(session ? toLocalInput(session.startAt) : defaultStart());
  const [end, setEnd] = useState(session ? toLocalInput(session.endAt) : defaultEnd());
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const startAt = new Date(start).toISOString();
    const endAt = new Date(end).toISOString();
    if (new Date(endAt) <= new Date(startAt)) {
      setError('End time must be after start time.');
      return;
    }
    setSaving(true);
    try {
      const payload = { courseId: courseId || null, startAt, endAt, notes };
      if (session) await sessionsApi.update(session.id, payload);
      else await sessionsApi.create(payload);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Modal
        title={session ? 'Edit session' : 'Log session'}
        onClose={onClose}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{session ? 'Save changes' : 'Create'}</Button>
          </>
        }
      >
        <Field label="Course" className="col-span-full">
          <select className="input" value={courseId ?? ''} onChange={e => setCourseId(e.target.value)}>
            <option value="">Unassigned</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </Field>
        <Field label="Start">
          <input className="input" type="datetime-local" required value={start} onChange={e => setStart(e.target.value)} />
        </Field>
        <Field label="End">
          <input className="input" type="datetime-local" required value={end} onChange={e => setEnd(e.target.value)} />
        </Field>
        <Field label="Notes" className="col-span-full">
          <textarea className="input" rows={3} value={notes ?? ''} onChange={e => setNotes(e.target.value)} />
        </Field>
        {error && <div className="text-accent-400 text-xs col-span-full">{error}</div>}
      </Modal>
    </form>
  );
}
