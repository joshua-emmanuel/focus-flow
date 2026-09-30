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

