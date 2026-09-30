import { describe, it, expect } from 'vitest';
import {
  isValidPriority,
  validateTodoTitle,
  isValidDateString,
  sanitizeTodo,
} from './todo.utils';

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
});

