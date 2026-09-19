import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coursesApi, tasksApi } from '../../api/resources';
import type { Priority, Task, TaskType } from '../../api/types';
import { Modal } from '../ui/Modal';
import { Field } from '../ui/Field';
import { Button } from '../ui/Button';

const TYPES: TaskType[] = ['ASSIGNMENT', 'HOMEWORK', 'PROJECT', 'QUIZ', 'EXAM'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

function todayIso(): string {
  return new Date().toLocaleDateString('en-CA');
}

interface Props {
  task?: Task;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskModal({ task, onClose, onSaved }: Props) {
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: coursesApi.list });

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [courseId, setCourseId] = useState(task?.courseId ?? '');
  const [type, setType] = useState<TaskType>(task?.type ?? 'ASSIGNMENT');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? todayIso());
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'MEDIUM');
  const [estimatedMin, setEstimatedMin] = useState(task?.estimatedMin ?? 60);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { title, description, courseId: courseId || null, type, dueDate, priority, estimatedMin };
      if (task) await tasksApi.update(task.id, payload);
      else await tasksApi.create(payload);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Modal
        title={task ? 'Edit task' : 'New task'}
        onClose={onClose}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{task ? 'Save changes' : 'Create'}</Button>
          </>
        }
      >
        <Field label="Title" className="col-span-full">
          <input className="input" required value={title} onChange={e => setTitle(e.target.value)} />
        </Field>
        <Field label="Description" className="col-span-full">
          <textarea className="input" rows={3} value={description ?? ''} onChange={e => setDescription(e.target.value)} />
        </Field>
        <Field label="Course">
          <select className="input" value={courseId ?? ''} onChange={e => setCourseId(e.target.value)}>
            <option value="">Unassigned</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select className="input" value={type} onChange={e => setType(e.target.value as TaskType)}>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Due date">
          <input className="input" type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </Field>
        <Field label="Priority">
          <select className="input" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Estimated study time (minutes)" className="col-span-full">
          <input className="input" type="number" min={0} max={1440} value={estimatedMin} onChange={e => setEstimatedMin(Number(e.target.value))} />
        </Field>
      </Modal>
    </form>
  );
}
