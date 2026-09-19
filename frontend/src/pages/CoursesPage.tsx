import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { coursesApi, analyticsApi } from '../api/resources';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Tag } from '../components/ui/Tag';
import { CourseModal } from '../components/courses/CourseModal';
import { fmtHours } from '../utils/format';
import type { Course } from '../api/types';

export function CoursesPage() {
  const queryClient = useQueryClient();
  const [modalCourse, setModalCourse] = useState<Course | 'new' | null>(null);

  const { data: courses = [], isLoading } = useQuery({ queryKey: ['courses'], queryFn: coursesApi.list });
  const { data: breakdown = [] } = useQuery({ queryKey: ['analytics', 'courses'], queryFn: analyticsApi.courses });
  const statsById = new Map(breakdown.map(b => [b.id, b]));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this course? Its tasks and sessions will be deleted too.')) return;
    await coursesApi.remove(id);
    refresh();
  };

  if (isLoading) return <div className="text-neutral-500">Loading…</div>;

  const totalCredits = courses.reduce((a, c) => a + c.credits, 0);

  return (
    <div className="animate-sp-rise">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="m-0 font-heading font-medium text-[28px] tracking-tight">Courses</h1>
          <p className="mt-2 text-neutral-400">{courses.length} courses · {totalCredits} credit hours</p>
        </div>
        <Button variant="primary" onClick={() => setModalCourse('new')}>
          <Plus size={16} /> Add course
        </Button>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {courses.map(c => {
          const stat = statsById.get(c.id);
          return (
            <div key={c.id} className="card p-6" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] tracking-wider uppercase text-accent">{c.code}</div>
                  <div className="font-heading font-medium text-[17px] mt-0.5">{c.name}</div>
                </div>
                <div className="flex gap-1 flex-none">
                  <IconButton label="Edit course" onClick={() => setModalCourse(c)}>
                    <PencilSimple size={14} />
                  </IconButton>
                  <IconButton label="Delete course" onClick={() => remove(c.id)}>
                    <Trash size={14} />
                  </IconButton>
                </div>
              </div>
              <div className="mt-4 text-neutral-400 text-[13px]">
                {c.instructor}
                <br />
                {c.semester} · {c.credits} credits
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                <Tag variant="outline">{stat?.openTasks ?? 0} open {stat?.openTasks === 1 ? 'task' : 'tasks'}</Tag>
                <Tag variant="neutral">{fmtHours(stat?.hoursStudied ?? 0)} studied</Tag>
              </div>
            </div>
          );
        })}
      </div>

      {modalCourse && (
        <CourseModal
          course={modalCourse === 'new' ? undefined : modalCourse}
          onClose={() => setModalCourse(null)}
          onSaved={() => {
            setModalCourse(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
