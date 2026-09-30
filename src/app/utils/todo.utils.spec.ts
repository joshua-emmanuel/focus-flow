import { describe, it, expect } from 'vitest';
import {
  isValidPriority,
  validateTodoTitle,
  isValidDateString,
  sanitizeTodo,
  getTodayDateString,
  isTaskOverdue,
  isTaskDueToday,
  sortTodos,
} from './todo.utils';
import { Todo } from '../models/todo.model';

describe('Todo Utils Validation & Sanitization', () => {
  describe('isValidPriority', () => {
    it('should return true for valid priority strings', () => {
      expect(isValidPriority('low')).toBe(true);
      expect(isValidPriority('medium')).toBe(true);
      expect(isValidPriority('high')).toBe(true);
    });

    it('should return false for invalid priority values', () => {
      expect(isValidPriority('urgent')).toBe(false);
      expect(isValidPriority('')).toBe(false);
      expect(isValidPriority(null)).toBe(false);
      expect(isValidPriority(undefined)).toBe(false);
      expect(isValidPriority(123)).toBe(false);
    });
  });

  describe('validateTodoTitle', () => {
    it('should accept valid non-empty trimmed titles', () => {
      const result = validateTodoTitle('  Buy groceries  ');
      expect(result.valid).toBe(true);
      expect(result.cleanTitle).toBe('Buy groceries');
      expect(result.error).toBeUndefined();
    });

    it('should reject empty or whitespace-only titles', () => {
      const emptyResult = validateTodoTitle('');
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.error).toContain('cannot be empty');

      const spaceResult = validateTodoTitle('    ');
      expect(spaceResult.valid).toBe(false);
      expect(spaceResult.error).toContain('cannot be empty');
    });

    it('should reject non-string titles', () => {
      expect(validateTodoTitle(null).valid).toBe(false);
      expect(validateTodoTitle(undefined).valid).toBe(false);
      expect(validateTodoTitle(123).valid).toBe(false);
      expect(validateTodoTitle({}).valid).toBe(false);
    });
  });

  describe('isValidDateString', () => {
    it('should validate YYYY-MM-DD format with valid dates', () => {
      expect(isValidDateString('2026-10-24')).toBe(true);
      expect(isValidDateString('2025-01-01')).toBe(true);
    });

    it('should return false for malformed date strings', () => {
      expect(isValidDateString('24-10-2026')).toBe(false);
      expect(isValidDateString('2026/10/24')).toBe(false);
      expect(isValidDateString('not-a-date')).toBe(false);
      expect(isValidDateString('')).toBe(false);
      expect(isValidDateString(null)).toBe(false);
    });
  });

  describe('sanitizeTodo', () => {
    it('should correctly sanitize a valid complete raw object', () => {
      const raw = {
        id: 'task-101',
        title: '  Finish feature spec  ',
        completed: true,
        priority: 'high',
        dueDate: '2026-10-25',
        category: 'Work',
        createdAt: '2026-09-30T06:00:00.000Z',
      };

      const sanitized = sanitizeTodo(raw);
      expect(sanitized).not.toBeNull();
      expect(sanitized).toEqual({
        id: 'task-101',
        title: 'Finish feature spec',
        completed: true,
        priority: 'high',
        dueDate: '2026-10-25',
        category: 'Work',
        createdAt: '2026-09-30T06:00:00.000Z',
      });
    });

    it('should apply resilient defaults for missing optional or malformed fields', () => {
      const raw = {
        id: 'task-102',
        title: 'Simple task',
      };

      const sanitized = sanitizeTodo(raw);
      expect(sanitized).not.toBeNull();
      expect(sanitized?.completed).toBe(false);
      expect(sanitized?.priority).toBe('medium');
      expect(sanitized?.dueDate).toBeNull();
      expect(sanitized?.category).toBeNull();
      expect(typeof sanitized?.createdAt).toBe('string');
    });

    it('should fallback priority to medium if priority value is invalid', () => {
      const raw = {
        id: 'task-103',
        title: 'Check notifications',
        priority: 'super-urgent',
      };

      const sanitized = sanitizeTodo(raw);
      expect(sanitized).not.toBeNull();
      expect(sanitized?.priority).toBe('medium');
    });

    it('should return null if id is missing or empty', () => {
      expect(sanitizeTodo({ title: 'No id' })).toBeNull();
      expect(sanitizeTodo({ id: '   ', title: 'Empty id' })).toBeNull();
    });

    it('should return null if title is missing, empty, or whitespace-only', () => {
      expect(sanitizeTodo({ id: 't-1' })).toBeNull();
      expect(sanitizeTodo({ id: 't-2', title: '' })).toBeNull();
      expect(sanitizeTodo({ id: 't-3', title: '   ' })).toBeNull();
    });

    it('should return null for non-object inputs', () => {
      expect(sanitizeTodo(null)).toBeNull();
      expect(sanitizeTodo(undefined)).toBeNull();
      expect(sanitizeTodo('string')).toBeNull();
      expect(sanitizeTodo(12345)).toBeNull();
    });
  });

  describe('getTodayDateString', () => {
    it('should return a date string matching YYYY-MM-DD format', () => {
      const today = getTodayDateString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isValidDateString(today)).toBe(true);
    });
  });

  describe('isTaskOverdue', () => {
    const referenceDate = '2026-10-15';

    it('should return true when task is incomplete and dueDate is before referenceDate', () => {
      expect(isTaskOverdue('2026-10-14', false, referenceDate)).toBe(true);
      expect(isTaskOverdue('2026-09-01', false, referenceDate)).toBe(true);
    });

    it('should return false when task is completed even if dueDate is before referenceDate', () => {
      expect(isTaskOverdue('2026-10-14', true, referenceDate)).toBe(false);
      expect(isTaskOverdue('2026-09-01', true, referenceDate)).toBe(false);
    });

    it('should return false when dueDate is today (referenceDate)', () => {
      expect(isTaskOverdue('2026-10-15', false, referenceDate)).toBe(false);
      expect(isTaskOverdue('2026-10-15', true, referenceDate)).toBe(false);
    });

    it('should return false when dueDate is in the future', () => {
      expect(isTaskOverdue('2026-10-16', false, referenceDate)).toBe(false);
      expect(isTaskOverdue('2026-12-31', false, referenceDate)).toBe(false);
    });

    it('should return false when dueDate is null or undefined or invalid', () => {
      expect(isTaskOverdue(null, false, referenceDate)).toBe(false);
      expect(isTaskOverdue(undefined, false, referenceDate)).toBe(false);
      expect(isTaskOverdue('invalid-date', false, referenceDate)).toBe(false);
    });
  });

  describe('isTaskDueToday', () => {
    const referenceDate = '2026-10-15';

    it('should return true when dueDate matches referenceDate', () => {
      expect(isTaskDueToday('2026-10-15', referenceDate)).toBe(true);
    });

    it('should return false when dueDate is different or invalid', () => {
      expect(isTaskDueToday('2026-10-14', referenceDate)).toBe(false);
      expect(isTaskDueToday('2026-10-16', referenceDate)).toBe(false);
      expect(isTaskDueToday(null, referenceDate)).toBe(false);
      expect(isTaskDueToday('not-a-date', referenceDate)).toBe(false);
    });
  });

  describe('sortTodos', () => {
    const ref = '2026-10-15';

    const overdueEarly: Todo = {
      id: 't-overdue-early',
      title: 'Old overdue task',
      completed: false,
      priority: 'high',
      dueDate: '2026-10-01',
      category: 'Work',
      createdAt: '2026-09-01T10:00:00.000Z',
    };

    const overdueLate: Todo = {
      id: 't-overdue-late',
      title: 'Recent overdue task',
      completed: false,
      priority: 'medium',
      dueDate: '2026-10-14',
      category: 'Personal',
      createdAt: '2026-09-10T10:00:00.000Z',
    };

    const dueToday1: Todo = {
      id: 't-today-1',
      title: 'Today task older created',
      completed: false,
      priority: 'medium',
      dueDate: '2026-10-15',
      category: null,
      createdAt: '2026-10-15T08:00:00.000Z',
    };

    const dueToday2: Todo = {
      id: 't-today-2',
      title: 'Today task newer created',
      completed: false,
      priority: 'high',
      dueDate: '2026-10-15',
      category: null,
      createdAt: '2026-10-15T12:00:00.000Z',
    };

    const upcomingSoon: Todo = {
      id: 't-upcoming-soon',
      title: 'Upcoming tomorrow',
      completed: false,
      priority: 'low',
      dueDate: '2026-10-16',
      category: null,
      createdAt: '2026-10-10T10:00:00.000Z',
    };

    const upcomingLater: Todo = {
      id: 't-upcoming-later',
      title: 'Upcoming next week',
      completed: false,
      priority: 'medium',
      dueDate: '2026-10-22',
      category: null,
      createdAt: '2026-10-10T10:00:00.000Z',
    };

    const noDate1: Todo = {
      id: 't-nodate-1',
      title: 'No date older',
      completed: false,
      priority: 'low',
      dueDate: null,
      category: null,
      createdAt: '2026-10-05T10:00:00.000Z',
    };

    const noDate2: Todo = {
      id: 't-nodate-2',
      title: 'No date newer',
      completed: false,
      priority: 'medium',
      dueDate: null,
      category: null,
      createdAt: '2026-10-12T10:00:00.000Z',
    };

    const completedOverdue: Todo = {
      id: 't-completed-overdue',
      title: 'Completed but was past due',
      completed: true,
      priority: 'high',
      dueDate: '2026-10-01',
      category: null,
      createdAt: '2026-10-01T10:00:00.000Z',
    };

    const completedRecent: Todo = {
      id: 't-completed-recent',
      title: 'Completed recently',
      completed: true,
      priority: 'low',
      dueDate: '2026-10-20',
      category: null,
      createdAt: '2026-10-14T10:00:00.000Z',
    };

    it('should order todos with overdue first, then today, upcoming, undated, and completed last', () => {
      // Pass tasks in arbitrary disordered array
      const unordered: Todo[] = [
        completedOverdue,
        upcomingLater,
        noDate1,
        dueToday1,
        overdueLate,
        noDate2,
        completedRecent,
        overdueEarly,
        upcomingSoon,
        dueToday2,
      ];

      const sorted = sortTodos(unordered, ref);
      const ids = sorted.map((t) => t.id);

      expect(ids).toEqual([
        't-overdue-early',    // Overdue earliest due date (2026-10-01)
        't-overdue-late',     // Overdue later due date (2026-10-14)
        't-today-2',          // Today task (newer created)
        't-today-1',          // Today task (older created)
        't-upcoming-soon',    // Upcoming soonest (2026-10-16)
        't-upcoming-later',   // Upcoming later (2026-10-22)
        't-nodate-2',         // No date (newer created)
        't-nodate-1',         // No date (older created)
        't-completed-recent', // Completed (newer created)
        't-completed-overdue',// Completed (older created)
      ]);
    });

    it('should return an empty array when given an empty list', () => {
      expect(sortTodos([], ref)).toEqual([]);
    });

    it('should not mutate the original array', () => {
      const original = [upcomingSoon, overdueEarly];
      const copy = [...original];
      const result = sortTodos(original, ref);

      expect(original).toEqual(copy);
      expect(result).not.toBe(original);
    });
  });
});


