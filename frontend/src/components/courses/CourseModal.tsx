import { useState, type FormEvent } from 'react';
import { coursesApi } from '../../api/resources';
import type { Course } from '../../api/types';
import { Modal } from '../ui/Modal';
import { Field } from '../ui/Field';
import { Button } from '../ui/Button';

const PALETTE = ['#b5abfc', '#968ae0', '#796cbf', '#9690c9', '#75798c', '#4c5397'];

interface Props {
  course?: Course;
  onClose: () => void;
  onSaved: () => void;
}

export function CourseModal({ course, onClose, onSaved }: Props) {
  const [name, setName] = useState(course?.name ?? '');
  const [code, setCode] = useState(course?.code ?? '');
  const [instructor, setInstructor] = useState(course?.instructor ?? '');
  const [semester, setSemester] = useState(course?.semester ?? '');
  const [credits, setCredits] = useState(course?.credits ?? 3);
  const [color, setColor] = useState(course?.color ?? PALETTE[0]);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, code, instructor, semester, credits, color };
      if (course) await coursesApi.update(course.id, payload);
      else await coursesApi.create(payload);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Modal
        title={course ? 'Edit course' : 'New course'}
        onClose={onClose}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>{course ? 'Save changes' : 'Create'}</Button>
          </>
        }
      >
        <Field label="Course name" className="col-span-full">
          <input className="input" required value={name} onChange={e => setName(e.target.value)} />
        </Field>
        <Field label="Code">
          <input className="input" required value={code} onChange={e => setCode(e.target.value)} />
        </Field>
        <Field label="Instructor">
          <input className="input" value={instructor ?? ''} onChange={e => setInstructor(e.target.value)} />
        </Field>
        <Field label="Semester">
          <input className="input" value={semester ?? ''} onChange={e => setSemester(e.target.value)} />
        </Field>
        <Field label="Credit hours">
          <input className="input" type="number" min={0} max={20} value={credits} onChange={e => setCredits(Number(e.target.value))} />
        </Field>
        <Field label="Color tag">
          <select className="input" value={color} onChange={e => setColor(e.target.value)}>
            {PALETTE.map((p, i) => <option key={p} value={p}>Tag {i + 1}</option>)}
          </select>
        </Field>
      </Modal>
    </form>
  );
}
