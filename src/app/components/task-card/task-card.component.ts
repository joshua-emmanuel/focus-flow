import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Priority, Todo } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';
import { isTaskOverdue, isValidPriority, validateTodoTitle } from '../../utils/todo.utils';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [],
  templateUrl: './task-card.component.html',
})
export class TaskCardComponent {
  protected readonly todoService = inject(TodoService);

  readonly task = input.required<Todo>();
  readonly toggle = output<string>();

  // Deletion state
  readonly isConfirmingDelete = signal(false);

  // Inline editing state
  readonly isEditing = signal(false);
  readonly editTitle = signal('');
  readonly editPriority = signal<Priority>('medium');
  readonly editCategory = signal<string>('Work');
  readonly editDueDate = signal<string>('');
  readonly editError = signal<string | null>(null);

  readonly priorities = ['low', 'medium', 'high'] as const;
  readonly categories = ['Work', 'Personal', 'Projects'] as const;

  readonly isOverdue = computed(() =>
    isTaskOverdue(this.task().dueDate, this.task().completed)
  );

  readonly priorityBadgeClass = computed(() => {
    switch (this.task().priority) {
      case 'high':
        return 'badge-high bg-rose-600 text-white';
      case 'medium':
        return 'badge-med bg-amber-700 text-white';
      case 'low':
      default:
        return 'badge-low bg-emerald-600 text-white';
    }
  });

  readonly categoryBadgeClass = computed(() => {
    const cat = this.task().category;
    if (!cat) return '';
    switch (cat.toLowerCase()) {
      case 'work':
        return 'badge-work bg-indigo-600 text-white';
      case 'personal':
        return 'badge-personal bg-violet-600 text-white';
      case 'projects':
        return 'badge-project bg-cyan-700 text-white';
      default:
        return 'badge-tag bg-slate-600 text-white';
    }
  });

  onToggle(): void {
    this.toggle.emit(this.task().id);
  }

  // Deletion handlers
  startDelete(): void {
    this.isEditing.set(false);
    this.isConfirmingDelete.set(true);
  }

  cancelDelete(): void {
    this.isConfirmingDelete.set(false);
  }

  confirmDelete(): void {
    this.todoService.deleteTodo(this.task().id);
    this.isConfirmingDelete.set(false);
  }

  // Inline editing handlers
  startEdit(): void {
    this.isConfirmingDelete.set(false);
    this.editTitle.set(this.task().title);
    this.editPriority.set(this.task().priority);
    this.editCategory.set(this.task().category || 'Work');
    this.editDueDate.set(this.task().dueDate || '');
    this.editError.set(null);
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editError.set(null);
  }

  saveEdit(): void {
    const titleResult = validateTodoTitle(this.editTitle());
    if (!titleResult.valid || !titleResult.cleanTitle) {
      this.editError.set(titleResult.error ?? 'Task title cannot be empty.');
      return;
    }

    this.todoService.updateTodo(this.task().id, {
      title: titleResult.cleanTitle,
      priority: this.editPriority(),
      category: this.editCategory(),
      dueDate: this.editDueDate().trim() ? this.editDueDate().trim() : null,
    });

    this.isEditing.set(false);
    this.editError.set(null);
  }

  onTitleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editTitle.set(input.value);
    if (this.editError()) {
      this.editError.set(null);
    }
  }

  onPrioritySelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (isValidPriority(select.value)) {
      this.editPriority.set(select.value);
    }
  }

  onCategorySelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.editCategory.set(select.value);
  }

  onDueDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editDueDate.set(input.value);
  }
}
