import { Injectable, computed, signal } from '@angular/core';
import {
  CreateTodoInput,
  FilterState,
  Priority,
  Todo,
  UpdateTodoInput,
} from '../models/todo.model';
import {
  filterTodos,
  getTodayDateString,
  isTaskOverdue,
  isValidPriority,
  sanitizeTodo,
  sortTodos,
  validateTodoTitle,
} from '../utils/todo.utils';

export const FOCUSFLOW_STORAGE_KEY = 'focusflow_tasks';

export const INITIAL_FILTER_STATE: FilterState = {
  searchQuery: '',
  statusFilter: 'all',
  categoryFilter: null,
  priorityFilter: null,
};

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private readonly _todos = signal<Todo[]>([]);
  private readonly _filterState = signal<FilterState>({ ...INITIAL_FILTER_STATE });

  readonly todos = this._todos.asReadonly();
  readonly filterState = this._filterState.asReadonly();

  readonly isFiltered = computed(() => {
    const f = this._filterState();
    return Boolean(
      f.searchQuery.trim().length > 0 ||
      f.statusFilter !== 'all' ||
      f.categoryFilter !== null ||
      f.priorityFilter !== null
    );
  });

  readonly sortedTodos = computed(() => sortTodos(this._todos()));

  readonly filteredTodos = computed(() => {
    const filtered = filterTodos(this._todos(), this._filterState());
    return sortTodos(filtered);
  });

  readonly filteredCount = computed(() => this.filteredTodos().length);

  readonly activeTodos = computed(() => this._todos().filter((todo) => !todo.completed));

  readonly completedTodos = computed(() => this._todos().filter((todo) => todo.completed));

  readonly overdueTodos = computed(() =>
    this.activeTodos().filter((todo) => isTaskOverdue(todo.dueDate, todo.completed))
  );

  readonly overdueCount = computed(() => this.overdueTodos().length);

  readonly upcomingTodos = computed(() =>
    this.activeTodos().filter(
      (todo) => todo.dueDate !== null && todo.dueDate > getTodayDateString()
    )
  );

  readonly upcomingTodosCount = computed(() => this.upcomingTodos().length);

  readonly activeTodosCount = computed(() => this.activeTodos().length);

  readonly completedTodosCount = computed(() => this.completedTodos().length);

  readonly totalCount = computed(() => this._todos().length);

  readonly completionRate = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.completedTodosCount() / total) * 100);
  });

  constructor() {
    this.loadTodos();
    this.initStorageEventListener();
  }

  /**
   * Loads todos from localStorage into the reactive signal.
   */
  loadTodos(): void {
    const loaded = this.readFromStorage();
    this._todos.set(loaded);
  }

  /**
   * Adds a new task with validation and generates a unique ID and creation timestamp.
   * Throws an Error if the task title is invalid.
   */
  addTodo(input: CreateTodoInput): Todo {
    const titleResult = validateTodoTitle(input.title);
    if (!titleResult.valid || !titleResult.cleanTitle) {
      throw new Error(titleResult.error ?? 'Invalid task title');
    }

    const priority: Priority = isValidPriority(input.priority) ? input.priority : 'medium';

    let dueDate: string | null = null;
    if (typeof input.dueDate === 'string' && input.dueDate.trim().length > 0) {
      dueDate = input.dueDate.trim();
    }

    let category: string | null = null;
    if (typeof input.category === 'string' && input.category.trim().length > 0) {
      category = input.category.trim();
    }

    const newTodo: Todo = {
      id: this.generateUniqueId(),
      title: titleResult.cleanTitle,
      completed: false,
      priority,
      dueDate,
      category,
      createdAt: new Date().toISOString(),
    };

    this._todos.update((current) => [newTodo, ...current]);
    this.persistToStorage(this._todos());

    return newTodo;
  }

  /**
   * Toggles the completed status of an existing task.
   */
  toggleTodo(id: string): void {
    let changed = false;
    this._todos.update((current) =>
      current.map((todo) => {
        if (todo.id === id) {
          changed = true;
          return { ...todo, completed: !todo.completed };
        }
        return todo;
      })
    );

    if (changed) {
      this.persistToStorage(this._todos());
    }
  }

  /**
   * Updates fields on an existing task.
   * Throws an error if title is specified but invalid.
   */
  updateTodo(id: string, updates: UpdateTodoInput): void {
    let cleanTitle: string | undefined;
    if (updates.title !== undefined) {
      const titleResult = validateTodoTitle(updates.title);
      if (!titleResult.valid || !titleResult.cleanTitle) {
        throw new Error(titleResult.error ?? 'Invalid task title');
      }
      cleanTitle = titleResult.cleanTitle;
    }

    let changed = false;
    this._todos.update((current) =>
      current.map((todo) => {
        if (todo.id !== id) return todo;

        changed = true;
        const updated: Todo = { ...todo };

        if (cleanTitle !== undefined) {
          updated.title = cleanTitle;
        }

        if (typeof updates.completed === 'boolean') {
          updated.completed = updates.completed;
        }

        if (updates.priority !== undefined && isValidPriority(updates.priority)) {
          updated.priority = updates.priority;
        }

        if (updates.dueDate !== undefined) {
          updated.dueDate =
            typeof updates.dueDate === 'string' && updates.dueDate.trim().length > 0
              ? updates.dueDate.trim()
              : null;
        }

        if (updates.category !== undefined) {
          updated.category =
            typeof updates.category === 'string' && updates.category.trim().length > 0
              ? updates.category.trim()
              : null;
        }

        return updated;
      })
    );

    if (changed) {
      this.persistToStorage(this._todos());
    }
  }

  /**
   * Deletes a single task by ID.
   */
  deleteTodo(id: string): void {
    let changed = false;
    this._todos.update((current) => {
      const filtered = current.filter((todo) => todo.id !== id);
      if (filtered.length !== current.length) {
        changed = true;
      }
      return filtered;
    });

    if (changed) {
      this.persistToStorage(this._todos());
    }
  }

  /**
   * Removes all completed tasks in a single batch operation.
   */
  clearCompleted(): void {
    let changed = false;
    this._todos.update((current) => {
      const active = current.filter((todo) => !todo.completed);
      if (active.length !== current.length) {
        changed = true;
      }
      return active;
    });

    if (changed) {
      this.persistToStorage(this._todos());
    }
  }

  /**
   * Resets all tasks in memory and clears localStorage.
   */
  clearAll(): void {
    this._todos.set([]);
    this.persistToStorage([]);
  }

  /**
   * Updates the search query filter.
   */
  setSearchQuery(query: string): void {
    this._filterState.update((current) => ({ ...current, searchQuery: query }));
  }

  /**
   * Updates the completion status filter tab ('all' | 'active' | 'completed' | 'upcoming').
   */
  setStatusFilter(status: 'all' | 'active' | 'completed' | 'upcoming'): void {
    this._filterState.update((current) => ({ ...current, statusFilter: status }));
  }

  /**
   * Updates the category filter (null matches all categories).
   */
  setCategoryFilter(category: string | null): void {
    this._filterState.update((current) => ({ ...current, categoryFilter: category }));
  }

  /**
   * Updates the priority filter (null matches all priorities).
   */
  setPriorityFilter(priority: Priority | null): void {
    this._filterState.update((current) => ({ ...current, priorityFilter: priority }));
  }

  /**
   * Resets all filter settings back to initial state.
   */
  resetFilters(): void {
    this._filterState.set({ ...INITIAL_FILTER_STATE });
  }

  /**
   * Reads from browser localStorage with try/catch and data sanitization.
   */
  private readFromStorage(): Todo[] {
    if (!this.isStorageAvailable()) {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(FOCUSFLOW_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      const sanitizedList: Todo[] = [];
      for (const item of parsed) {
        const sanitized = sanitizeTodo(item);
        if (sanitized) {
          sanitizedList.push(sanitized);
        }
      }

      return sanitizedList;
    } catch {
      // Gracefully return empty array on corrupted JSON or storage errors
      return [];
    }
  }

  /**
   * Persists the given array of Todos to browser localStorage.
   */
  private persistToStorage(todos: Todo[]): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      const serialized = JSON.stringify(todos);
      window.localStorage.setItem(FOCUSFLOW_STORAGE_KEY, serialized);
    } catch {
      // Storage quota exceeded or private mode restriction; do not crash the app
    }
  }

  /**
   * Cross-tab synchronization via standard window storage event.
   */
  private initStorageEventListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === FOCUSFLOW_STORAGE_KEY) {
        this.loadTodos();
      }
    });
  }

  /**
   * Generates a unique task identifier.
   */
  private generateUniqueId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Checks whether localStorage is supported and accessible.
   */
  private isStorageAvailable(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    return true;
  }
}
