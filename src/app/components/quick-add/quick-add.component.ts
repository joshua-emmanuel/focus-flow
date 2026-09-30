import { Component, inject, signal } from '@angular/core';
import { Priority } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-quick-add',
  standalone: true,
  imports: [],
  templateUrl: './quick-add.component.html',
})
export class QuickAddComponent {
  private readonly todoService = inject(TodoService);

  readonly title = signal('');
  readonly priority = signal<Priority>('medium');
  readonly category = signal('Work');
  readonly dueDate = signal(this.getTodayDateString());
  readonly errorMessage = signal<string | null>(null);

  onTitleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.title.set(input.value);
    if (this.errorMessage()) {
      this.errorMessage.set(null);
    }
  }

  setPriority(level: Priority): void {
    this.priority.set(level);
  }

  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.category.set(select.value);
  }

  onDueDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dueDate.set(input.value);
  }

  onSubmit(): void {
    const rawTitle = this.title().trim();
    if (!rawTitle) {
      this.errorMessage.set('Task title cannot be empty.');
      return;
    }

    try {
      this.todoService.addTodo({
        title: rawTitle,
        priority: this.priority(),
        category: this.category(),
        dueDate: this.dueDate() || null,
      });

      // Reset input on success
      this.title.set('');
      this.errorMessage.set(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add task';
      this.errorMessage.set(message);
    }
  }

  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
