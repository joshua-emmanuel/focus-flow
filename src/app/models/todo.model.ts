export type Priority = 'low' | 'medium' | 'high';

export const VALID_PRIORITIES: readonly Priority[] = ['low', 'medium', 'high'] as const;

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  category: string | null;
  createdAt: string;
}

export interface CreateTodoInput {
  title: string;
  priority?: Priority;
  dueDate?: string | null;
  category?: string | null;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
  priority?: Priority;
  dueDate?: string | null;
  category?: string | null;
}

export interface FilterState {
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'completed';
  categoryFilter: string | null;
  priorityFilter: Priority | null;
}

export interface TitleValidationResult {
  valid: boolean;
  cleanTitle?: string;
  error?: string;
}

