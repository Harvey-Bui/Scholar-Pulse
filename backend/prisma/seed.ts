import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PALETTE = ['#b5abfc', '#968ae0', '#796cbf', '#9690c9', '#75798c', '#4c5397'];

function shift(daysFromToday: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function atTime(daysFromToday: number, hh: number, mm: number): Date {
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  return d;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to seed demo data: NODE_ENV=production. This script creates a well-known demo login ' +
        '(demo@scholarpulse.app / demo1234) and is only meant for local/dev databases.',
    );
  }

  const email = 'demo@scholarpulse.app';
  const passwordHash = await bcrypt.hash('demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: 'Harvey Bui',
      program: 'BSc Computer Science, year 2',
      currentSemester: 'Fall 2026',
      goalWeeklyHours: 20,
      goalWeeklyTasks: 5,
      goalStreakDays: 7,
    },
  });

  const courseDefs = [
    { key: 'c1', name: 'Data Structures', code: 'CS 261', instructor: 'Dr. A. Reyes', semester: 'Fall 2026', credits: 4, color: PALETTE[0] },
    { key: 'c2', name: 'Linear Algebra', code: 'MATH 221', instructor: 'Prof. H. Oduya', semester: 'Fall 2026', credits: 3, color: PALETTE[1] },
    { key: 'c3', name: 'Organic Chemistry', code: 'CHEM 210', instructor: 'Dr. M. Lindqvist', semester: 'Fall 2026', credits: 4, color: PALETTE[2] },
    { key: 'c4', name: 'Technical Writing', code: 'ENGL 214', instructor: 'K. Bassett', semester: 'Fall 2026', credits: 2, color: PALETTE[3] },
    { key: 'c5', name: 'Microeconomics', code: 'ECON 101', instructor: 'Dr. S. Mbeki', semester: 'Fall 2026', credits: 3, color: PALETTE[4] },
  ];

  const courseIds: Record<string, string> = {};
  for (const c of courseDefs) {
    const created = await prisma.course.create({
      data: {
        userId: user.id,
        name: c.name,
        code: c.code,
        instructor: c.instructor,
        semester: c.semester,
        credits: c.credits,
        color: c.color,
      },
    });
    courseIds[c.key] = created.id;
  }

  const taskDefs: Array<{
    title: string; desc: string; due: number; priority: 'LOW' | 'MEDIUM' | 'HIGH';
    est: number; courseKey: string; type: 'ASSIGNMENT' | 'HOMEWORK' | 'PROJECT' | 'QUIZ' | 'EXAM';
    done?: boolean; doneAt?: number;
  }> = [
    { title: 'Problem set 4 — balanced trees', desc: 'AVL rotations and complexity proofs', due: 0, priority: 'HIGH', est: 150, courseKey: 'c1', type: 'HOMEWORK' },
    { title: 'Read ch. 6 before lecture', desc: 'Eigenvalues, skim the worked examples', due: 0, priority: 'LOW', est: 45, courseKey: 'c2', type: 'HOMEWORK', done: true, doneAt: 0 },
    { title: 'Lab report: aldol condensation', desc: 'Yield table plus mechanism discussion', due: 1, priority: 'HIGH', est: 180, courseKey: 'c3', type: 'ASSIGNMENT' },
    { title: 'Midterm 1', desc: 'Covers weeks 1–6, closed book', due: 4, priority: 'HIGH', est: 300, courseKey: 'c2', type: 'EXAM' },
    { title: 'Peer review draft', desc: 'Two classmates, 300 words each', due: 2, priority: 'MEDIUM', est: 60, courseKey: 'c4', type: 'ASSIGNMENT' },
    { title: 'Graph traversal quiz', desc: 'BFS, DFS, shortest paths', due: 6, priority: 'MEDIUM', est: 90, courseKey: 'c1', type: 'QUIZ' },
    { title: 'Elasticity problem set', desc: '', due: 8, priority: 'LOW', est: 75, courseKey: 'c5', type: 'HOMEWORK' },
    { title: 'Group project milestone 2', desc: 'API layer and test plan', due: 11, priority: 'HIGH', est: 240, courseKey: 'c1', type: 'PROJECT' },
    { title: 'Chem final exam', desc: '', due: 23, priority: 'HIGH', est: 420, courseKey: 'c3', type: 'EXAM' },
    { title: 'Annotated bibliography', desc: 'Twelve sources, APA', due: -2, priority: 'MEDIUM', est: 120, courseKey: 'c4', type: 'ASSIGNMENT', done: true, doneAt: -2 },
  ];

  for (const t of taskDefs) {
    await prisma.task.create({
      data: {
        userId: user.id,
        courseId: courseIds[t.courseKey],
        title: t.title,
        description: t.desc || null,
        dueDate: shift(t.due),
        priority: t.priority,
        estimatedMin: t.est,
        type: t.type,
        done: !!t.done,
        doneAt: t.doneAt != null ? shift(t.doneAt) : null,
      },
    });
  }

  const sessionDefs: Array<{ courseKey: string; day: number; start: [number, number]; end: [number, number]; notes: string }> = [
    { courseKey: 'c1', day: -4, start: [19, 0], end: [21, 0], notes: 'Tree rotations by hand' },
    { courseKey: 'c2', day: -3, start: [10, 0], end: [11, 30], notes: 'Practice problems with Ines' },
    { courseKey: 'c3', day: -3, start: [15, 0], end: [16, 30], notes: 'Lab prep' },
    { courseKey: 'c1', day: -2, start: [20, 0], end: [22, 15], notes: 'Problem set 4, first half' },
    { courseKey: 'c4', day: -1, start: [13, 0], end: [14, 0], notes: 'Outline for peer review' },
    { courseKey: 'c2', day: 0, start: [9, 0], end: [10, 30], notes: 'Midterm review sheet' },
    { courseKey: 'c3', day: 1, start: [16, 0], end: [18, 0], notes: 'Write up the yield table' },
    { courseKey: 'c2', day: 2, start: [11, 0], end: [13, 0], notes: 'Past papers, timed' },
  ];

  for (const s of sessionDefs) {
    await prisma.studySession.create({
      data: {
        userId: user.id,
        courseId: courseIds[s.courseKey],
        startAt: atTime(s.day, s.start[0], s.start[1]),
        endAt: atTime(s.day, s.end[0], s.end[1]),
        notes: s.notes,
      },
    });
  }

  const availabilityDefs = [
    { dayOfWeek: 1, startTime: '18:00', endTime: '21:00' },
    { dayOfWeek: 2, startTime: '18:00', endTime: '21:00' },
    { dayOfWeek: 3, startTime: '18:00', endTime: '21:00' },
    { dayOfWeek: 4, startTime: '18:00', endTime: '21:00' },
    { dayOfWeek: 6, startTime: '13:00', endTime: '17:00' },
    { dayOfWeek: 0, startTime: '13:00', endTime: '17:00' },
  ];
  for (const a of availabilityDefs) {
    await prisma.availabilityWindow.create({ data: { userId: user.id, ...a } });
  }

  console.log(`Seeded demo user: ${email} / demo1234`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
