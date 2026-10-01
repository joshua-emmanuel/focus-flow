import { Todo } from '../models/todo.model';

/**
 * Returns a fresh set of sample tasks with dates computed relative to today,
 * so they never go stale regardless of when the app is opened.
 */
export function getSampleTodos(): Todo[] {
  const now = new Date();

  const dateOffset = (days: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  };

  const ts = (daysAgo = 0): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  return [
    {
      id: 'sample-1',
      title: 'Prepare Q4 performance review',
      completed: false,
      priority: 'high',
      dueDate: dateOffset(-1), // yesterday → overdue
      category: 'Work',
      createdAt: ts(3),
    },
    {
      id: 'sample-2',
      title: 'Send project proposal to client',
      completed: false,
      priority: 'high',
      dueDate: dateOffset(0), // today
      category: 'Work',
      createdAt: ts(2),
    },
    {
      id: 'sample-3',
      title: 'Book dentist appointment',
      completed: false,
      priority: 'medium',
      dueDate: dateOffset(0), // today
      category: 'Personal',
      createdAt: ts(1),
    },
    {
      id: 'sample-4',
      title: 'Review pull requests on GitHub',
      completed: false,
      priority: 'medium',
      dueDate: dateOffset(3), // in 3 days
      category: 'Projects',
      createdAt: ts(1),
    },
    {
      id: 'sample-5',
      title: 'Plan team offsite agenda',
      completed: false,
      priority: 'low',
      dueDate: dateOffset(7), // in a week
      category: 'Work',
      createdAt: ts(0),
    },
    {
      id: 'sample-6',
      title: 'Read "Atomic Habits" chapter 5',
      completed: true,
      priority: 'low',
      dueDate: dateOffset(-2), // two days ago, already done
      category: 'Personal',
      createdAt: ts(4),
    },
  ];
}
