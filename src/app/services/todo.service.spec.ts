import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FOCUSFLOW_STORAGE_KEY, TodoService } from './todo.service';

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(() => {
    // Clear storage before each test
    window.localStorage.clear();
    service = new TodoService();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Initial State & Loading', () => {
    it('should initialize with an empty list when localStorage has no data', () => {
      expect(service.todos()).toEqual([]);
      expect(service.totalCount()).toBe(0);
      expect(service.activeTodosCount()).toBe(0);
      expect(service.completedTodosCount()).toBe(0);
      expect(service.completionRate()).toBe(0);
    });

    it('should load pre-existing valid tasks from localStorage', () => {
      const existing = [
        {
          id: 'pre-1',
          title: 'Existing task',
          completed: false,
          priority: 'medium',
          dueDate: null,
          category: 'Work',
          createdAt: '2026-09-30T00:00:00.000Z',
        },
      ];
      window.localStorage.setItem(FOCUSFLOW_STORAGE_KEY, JSON.stringify(existing));

      const freshService = new TodoService();
      expect(freshService.todos().length).toBe(1);
      expect(freshService.todos()[0].title).toBe('Existing task');
      expect(freshService.activeTodosCount()).toBe(1);
    });
  });

  describe('addTodo', () => {
    it('should add a valid task and persist it to localStorage', () => {
      const created = service.addTodo({
        title: 'Review pull request',
        priority: 'high',
        dueDate: '2026-10-24',
        category: 'Work',
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Review pull request');
      expect(created.completed).toBe(false);
      expect(created.priority).toBe('high');
      expect(created.dueDate).toBe('2026-10-24');
      expect(created.category).toBe('Work');
      expect(created.createdAt).toBeDefined();

      expect(service.todos().length).toBe(1);
      expect(service.todos()[0]).toEqual(created);
      expect(service.totalCount()).toBe(1);
      expect(service.activeTodosCount()).toBe(1);

      // Verify localStorage persistence
      const stored = JSON.parse(window.localStorage.getItem(FOCUSFLOW_STORAGE_KEY) || '[]');
      expect(stored.length).toBe(1);
      expect(stored[0].id).toBe(created.id);
    });

    it('should reject tasks with empty or whitespace-only titles', () => {
      expect(() => service.addTodo({ title: '' })).toThrow(/cannot be empty/i);
      expect(() => service.addTodo({ title: '    ' })).toThrow(/cannot be empty/i);
      expect(service.todos().length).toBe(0);
    });

    it('should default priority to medium when not specified or invalid', () => {
      const created = service.addTodo({ title: 'Task with default priority' });
      expect(created.priority).toBe('medium');
    });

    it('should trim title, category, and dueDate', () => {
      const created = service.addTodo({
        title: '  Trimmed title  ',
        category: '  Personal  ',
        dueDate: '  2026-10-25  ',
      });

      expect(created.title).toBe('Trimmed title');
      expect(created.category).toBe('Personal');
      expect(created.dueDate).toBe('2026-10-25');
    });
  });

  describe('toggleTodo', () => {
    it('should toggle task completion status and recalculate metrics', () => {
      const task = service.addTodo({ title: 'Toggle test task' });
      expect(task.completed).toBe(false);
      expect(service.activeTodosCount()).toBe(1);
      expect(service.completedTodosCount()).toBe(0);
      expect(service.completionRate()).toBe(0);

      service.toggleTodo(task.id);
      expect(service.todos()[0].completed).toBe(true);
      expect(service.activeTodosCount()).toBe(0);
      expect(service.completedTodosCount()).toBe(1);
      expect(service.completionRate()).toBe(100);

      // Toggle back
      service.toggleTodo(task.id);
      expect(service.todos()[0].completed).toBe(false);
      expect(service.activeTodosCount()).toBe(1);
      expect(service.completedTodosCount()).toBe(0);
      expect(service.completionRate()).toBe(0);
    });

    it('should do nothing if task id is not found', () => {
      service.addTodo({ title: 'Task 1' });
      service.toggleTodo('non-existent-id');
      expect(service.todos().length).toBe(1);
      expect(service.todos()[0].completed).toBe(false);
    });
  });

  describe('updateTodo', () => {
    it('should update task title, priority, category, and dueDate', () => {
      const task = service.addTodo({ title: 'Original title', priority: 'low' });

      service.updateTodo(task.id, {
        title: 'New updated title',
        priority: 'high',
        dueDate: '2026-12-01',
        category: 'Projects',
      });

      const updated = service.todos()[0];
      expect(updated.title).toBe('New updated title');
      expect(updated.priority).toBe('high');
      expect(updated.dueDate).toBe('2026-12-01');
      expect(updated.category).toBe('Projects');
    });

    it('should throw an error when attempting to update with an empty title', () => {
      const task = service.addTodo({ title: 'Valid task' });
      expect(() => service.updateTodo(task.id, { title: '   ' })).toThrow(/cannot be empty/i);
    });
  });

  describe('deleteTodo', () => {
    it('should remove the task by id and persist updated list', () => {
      const t1 = service.addTodo({ title: 'Task 1' });
      const t2 = service.addTodo({ title: 'Task 2' });

      expect(service.totalCount()).toBe(2);

      service.deleteTodo(t1.id);
      expect(service.totalCount()).toBe(1);
      expect(service.todos().find((t) => t.id === t1.id)).toBeUndefined();
      expect(service.todos()[0].id).toBe(t2.id);

      const stored = JSON.parse(window.localStorage.getItem(FOCUSFLOW_STORAGE_KEY) || '[]');
      expect(stored.length).toBe(1);
      expect(stored[0].id).toBe(t2.id);
    });
  });

  describe('clearCompleted', () => {
    it('should remove all completed tasks while keeping active ones', () => {
      const t1 = service.addTodo({ title: 'Active 1' });
      const t2 = service.addTodo({ title: 'Completed 1' });
      const t3 = service.addTodo({ title: 'Completed 2' });

      service.toggleTodo(t2.id);
      service.toggleTodo(t3.id);

      expect(service.activeTodosCount()).toBe(1);
      expect(service.completedTodosCount()).toBe(2);

      service.clearCompleted();

      expect(service.totalCount()).toBe(1);
      expect(service.todos()[0].id).toBe(t1.id);
      expect(service.completedTodosCount()).toBe(0);
      expect(service.activeTodosCount()).toBe(1);
    });
  });

  describe('Storage Resilience & Error Handling', () => {
    it('should recover gracefully when localStorage contains corrupted JSON', () => {
      window.localStorage.setItem(FOCUSFLOW_STORAGE_KEY, 'corrupted-json-{[');

      const resilientService = new TodoService();
      expect(resilientService.todos()).toEqual([]);
      expect(resilientService.totalCount()).toBe(0);
    });

    it('should recover gracefully when localStorage contains a non-array JSON object', () => {
      window.localStorage.setItem(
        FOCUSFLOW_STORAGE_KEY,
        JSON.stringify({ unexpected: 'object-shape' })
      );

      const resilientService = new TodoService();
      expect(resilientService.todos()).toEqual([]);
    });

    it('should filter out corrupted items from localStorage and retain valid ones', () => {
      const mixedData = [
        { id: 'valid-1', title: 'Good task', completed: false, priority: 'medium' },
        { id: '', title: 'Missing ID task' }, // invalid
        null, // invalid
        { id: 'valid-2', title: 'Another good task', completed: true, priority: 'low' },
      ];
      window.localStorage.setItem(FOCUSFLOW_STORAGE_KEY, JSON.stringify(mixedData));

      const resilientService = new TodoService();
      expect(resilientService.todos().length).toBe(2);
      expect(resilientService.todos()[0].id).toBe('valid-1');
      expect(resilientService.todos()[1].id).toBe('valid-2');
    });

    it('should handle localStorage write errors without throwing', () => {
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        service.addTodo({ title: 'Task that triggers quota error' });
      }).not.toThrow();

      // In-memory state remains intact
      expect(service.todos().length).toBe(1);
    });
  });
});
