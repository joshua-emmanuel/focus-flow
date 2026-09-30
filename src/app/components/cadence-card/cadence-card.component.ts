import { Component, computed, inject, signal } from '@angular/core';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-cadence-card',
  standalone: true,
  imports: [],
  templateUrl: './cadence-card.component.html',
})
export class CadenceCardComponent {
  protected readonly todoService = inject(TodoService);

  readonly isConfirmingClear = signal(false);

  readonly activeTasksText = computed(() => {
    const count = this.todoService.activeTodosCount();
    if (count === 0) return 'All Caught Up!';
    if (count === 1) return '1 Active Task Left';
    return `${count} Active Tasks Left`;
  });

  startClear(): void {
    if (this.todoService.completedTodosCount() > 0) {
      this.isConfirmingClear.set(true);
    }
  }

  cancelClear(): void {
    this.isConfirmingClear.set(false);
  }

  confirmClear(): void {
    this.todoService.clearCompleted();
    this.isConfirmingClear.set(false);
  }
}
