import {
  Priority,
  TitleValidationResult,
  Todo,
  VALID_PRIORITIES,
} from '../models/todo.model';

/**
 * Checks whether a given value is a valid Priority.
 */
export function isValidPriority(value: unknown): value is Priority {
  return typeof value === 'string' && (VALID_PRIORITIES as readonly string[]).includes(value);
}

/**
 * Validates and trims a todo title.
 */
export function validateTodoTitle(title: unknown): TitleValidationResult {
  if (typeof title !== 'string') {
    return { valid: false, error: 'Task title must be a string.' };
  }
  const cleanTitle = title.trim();
  if (cleanTitle.length === 0) {
    return { valid: false, error: 'Task title cannot be empty.' };
  }
  return { valid: true, cleanTitle };
}

/**
 * Checks if a given date string conforms to YYYY-MM-DD format.
 */
export function isValidDateString(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = Date.parse(dateStr);
  return !Number.isNaN(parsed);
}

/**
 * Safely parses and sanitizes a raw object into a validated Todo instance,
 * or returns null if the object is malformed or unrecoverable.
 */
export function sanitizeTodo(raw: unknown): Todo | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Record<string, unknown>;

  if (typeof candidate['id'] !== 'string' || candidate['id'].trim().length === 0) {
    return null;
  }

  const titleResult = validateTodoTitle(candidate['title']);
  if (!titleResult.valid || !titleResult.cleanTitle) {
    return null;
  }

  const completed = typeof candidate['completed'] === 'boolean' ? candidate['completed'] : false;

  const priority: Priority = isValidPriority(candidate['priority'])
    ? candidate['priority']
    : 'medium';

  let dueDate: string | null = null;
  if (typeof candidate['dueDate'] === 'string' && candidate['dueDate'].trim().length > 0) {
    dueDate = candidate['dueDate'].trim();
  }

  let category: string | null = null;
  if (typeof candidate['category'] === 'string' && candidate['category'].trim().length > 0) {
    category = candidate['category'].trim();
  }

  let createdAt: string;
  if (typeof candidate['createdAt'] === 'string' && candidate['createdAt'].trim().length > 0) {
    createdAt = candidate['createdAt'];
  } else {
    createdAt = new Date().toISOString();
  }

  return {
    id: candidate['id'].trim(),
    title: titleResult.cleanTitle,
    completed,
    priority,
    dueDate,
    category,
    createdAt,
  };
}

/**
 * Returns the current date in YYYY-MM-DD local format.
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determines whether a task is overdue relative to a reference date (defaults to today).
 * Completed tasks and tasks without a due date are never overdue.
 */
export function isTaskOverdue(
  dueDate: string | null | undefined,
  completed: boolean,
  referenceDate: string = getTodayDateString()
): boolean {
  if (completed || !dueDate || !isValidDateString(dueDate)) {
    return false;
  }
  return dueDate < referenceDate;
}

/**
 * Determines whether a task is due today relative to a reference date (defaults to today).
 */
export function isTaskDueToday(
  dueDate: string | null | undefined,
  referenceDate: string = getTodayDateString()
): boolean {
  if (!dueDate || !isValidDateString(dueDate)) {
    return false;
  }
  return dueDate === referenceDate;
}

/**
 * Sorts todos chronologically and by urgency:
 * 1. Active overdue tasks (earliest due date first)
 * 2. Active tasks due today
 * 3. Active upcoming tasks (sorted ascending by due date)
 * 4. Active tasks with no due date (sorted descending by creation time)
 * 5. Completed tasks (sorted descending by creation time)
 */
export function sortTodos(
  todos: readonly Todo[],
  referenceDate: string = getTodayDateString()
): Todo[] {
  const overdue: Todo[] = [];
  const dueToday: Todo[] = [];
  const upcoming: Todo[] = [];
  const noDueDate: Todo[] = [];
  const completed: Todo[] = [];

  for (const task of todos) {
    if (task.completed) {
      completed.push(task);
    } else if (isTaskOverdue(task.dueDate, false, referenceDate)) {
      overdue.push(task);
    } else if (isTaskDueToday(task.dueDate, referenceDate)) {
      dueToday.push(task);
    } else if (task.dueDate && task.dueDate > referenceDate) {
      upcoming.push(task);
    } else {
      noDueDate.push(task);
    }
  }

  // Overdue: earliest due date first
  overdue.sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0));

  // Due today: newest first
  dueToday.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Upcoming: soonest due date first
  upcoming.sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0));

  // No due date: newest first
  noDueDate.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Completed: newest first
  completed.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return [...overdue, ...dueToday, ...upcoming, ...noDueDate, ...completed];
}

