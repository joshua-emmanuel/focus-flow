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

  describe('Sorting and Overdue Reactive Signals', () => {
    it('should compute overdueTodos and overdueCount correctly and update reactively', () => {
      expect(service.overdueCount()).toBe(0);
      expect(service.overdueTodos()).toEqual([]);

      // Add past-due task (2020-01-01 is definitely past)
      const pastTask = service.addTodo({
        title: 'Past due task',
        dueDate: '2020-01-01',
      });

      expect(service.overdueCount()).toBe(1);
      expect(service.overdueTodos().map((t) => t.id)).toEqual([pastTask.id]);

      // Add future task (2099-01-01 is definitely future)
      service.addTodo({
        title: 'Future task',
        dueDate: '2099-01-01',
      });

      // Add task with no due date
      service.addTodo({
        title: 'Undated task',
      });

      expect(service.overdueCount()).toBe(1);

      // Toggling the past-due task to completed should remove it from overdue
      service.toggleTodo(pastTask.id);
      expect(service.overdueCount()).toBe(0);
      expect(service.overdueTodos()).toEqual([]);

      // Toggling it back to active restores overdue state
      service.toggleTodo(pastTask.id);
      expect(service.overdueCount()).toBe(1);
      expect(service.overdueTodos()[0].id).toBe(pastTask.id);

      // Updating dueDate to future clears overdue state
      service.updateTodo(pastTask.id, { dueDate: '2099-12-31' });
      expect(service.overdueCount()).toBe(0);
    });

    it('should compute sortedTodos reactively with overdue items first and completed items last', () => {
      const future = service.addTodo({
        title: 'Future task',
        dueDate: '2099-01-01',
      });
      const overdue = service.addTodo({
        title: 'Overdue task',
        dueDate: '2020-01-01',
      });
      const undated = service.addTodo({
        title: 'Undated task',
      });

      // Active overdue should be first
      let sorted = service.sortedTodos();
      expect(sorted[0].id).toBe(overdue.id);

      // Toggling overdue task to completed should push it to the bottom
      service.toggleTodo(overdue.id);
      sorted = service.sortedTodos();
      expect(sorted[sorted.length - 1].id).toBe(overdue.id);
      expect(sorted[sorted.length - 1].completed).toBe(true);
    });
  });

  describe('Filtering Reactive Signals & Methods', () => {
    it('should initialize with default filter state and isFiltered false', () => {
      expect(service.isFiltered()).toBe(false);
      expect(service.filterState()).toEqual({
        searchQuery: '',
        statusFilter: 'all',
        categoryFilter: null,
        priorityFilter: null,
      });
      expect(service.filteredCount()).toBe(0);
    });

    it('should reactively filter todos by search query and update isFiltered', () => {
      const t1 = service.addTodo({ title: 'Angular testing setup' });
      const t2 = service.addTodo({ title: 'Cook dinner' });

      expect(service.filteredTodos().length).toBe(2);
      expect(service.isFiltered()).toBe(false);

      service.setSearchQuery('angular');
      expect(service.isFiltered()).toBe(true);
      expect(service.filteredCount()).toBe(1);
      expect(service.filteredTodos()[0].id).toBe(t1.id);

      service.setSearchQuery('');
      expect(service.isFiltered()).toBe(false);
      expect(service.filteredCount()).toBe(2);
    });

    it('should reactively filter todos by status tab', () => {
      const t1 = service.addTodo({ title: 'Task 1' });
      const t2 = service.addTodo({ title: 'Task 2' });
      service.toggleTodo(t1.id); // t1 completed, t2 active

      service.setStatusFilter('active');
      expect(service.isFiltered()).toBe(true);
      expect(service.filteredTodos().map((t) => t.id)).toEqual([t2.id]);

      service.setStatusFilter('completed');
      expect(service.filteredTodos().map((t) => t.id)).toEqual([t1.id]);

      // Add upcoming task
      const t3 = service.addTodo({ title: 'Upcoming Task', dueDate: '2099-01-01' });
      service.setStatusFilter('upcoming');
      expect(service.isFiltered()).toBe(true);
      expect(service.filteredTodos().map((t) => t.id)).toEqual([t3.id]);

      service.setStatusFilter('all');
      expect(service.isFiltered()).toBe(false);
      expect(service.filteredTodos().length).toBe(3);
    });

    it('should reactively filter by category and priority', () => {
      service.addTodo({ title: 'T1', category: 'Work', priority: 'high' });
      service.addTodo({ title: 'T2', category: 'Personal', priority: 'low' });
      service.addTodo({ title: 'T3', category: 'Work', priority: 'low' });

      service.setCategoryFilter('Work');
      expect(service.filteredCount()).toBe(2);

      service.setPriorityFilter('high');
      expect(service.filteredCount()).toBe(1);
      expect(service.filteredTodos()[0].title).toBe('T1');
    });

    it('should reset all filters when resetFilters() is called', () => {
      service.addTodo({ title: 'Task A' });
      service.setSearchQuery('search');
      service.setStatusFilter('completed');
      service.setCategoryFilter('Work');
      service.setPriorityFilter('high');
      expect(service.isFiltered()).toBe(true);

      service.resetFilters();
      expect(service.isFiltered()).toBe(false);
      expect(service.filterState().searchQuery).toBe('');
      expect(service.filterState().statusFilter).toBe('all');
      expect(service.filterState().categoryFilter).toBeNull();
      expect(service.filterState().priorityFilter).toBeNull();
      expect(service.filteredCount()).toBe(1);
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

  describe('loadSampleData', () => {
    it('should populate the service with sample tasks', () => {
      expect(service.todos().length).toBe(0);
      service.loadSampleData();
      expect(service.todos().length).toBeGreaterThan(0);
    });

    it('should persist sample tasks to localStorage', () => {
      service.loadSampleData();
      const stored = JSON.parse(window.localStorage.getItem(FOCUSFLOW_STORAGE_KEY)!);
      expect(Array.isArray(stored)).toBe(true);
      expect(stored.length).toEqual(service.todos().length);
    });

    it('should reset filters after loading sample data', () => {
      service.setSearchQuery('something');
      service.setStatusFilter('completed');
      service.loadSampleData();
      const fs = service.filterState();
      expect(fs.searchQuery).toBe('');
      expect(fs.statusFilter).toBe('all');
    });

    it('should include at least one overdue task in sample data', () => {
      service.loadSampleData();
      expect(service.overdueCount()).toBeGreaterThan(0);
    });

    it('should include at least one completed task in sample data', () => {
      service.loadSampleData();
      expect(service.completedTodosCount()).toBeGreaterThan(0);
    });

    it('should replace existing tasks when called again', () => {
      service.addTodo({ title: 'My own task' });
      expect(service.todos().length).toBe(1);
      service.loadSampleData();
      const hasSampleTask = service.todos().some((t) => t.id.startsWith('sample-'));
      expect(hasSampleTask).toBe(true);
    });
  });
});
