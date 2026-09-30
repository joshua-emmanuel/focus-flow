import { Component, inject } from '@angular/core';
import { Priority } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-filter-controls',
  standalone: true,
  imports: [],
  templateUrl: './filter-controls.component.html',
})
export class FilterControlsComponent {
  protected readonly todoService = inject(TodoService);

  readonly categories = ['Work', 'Personal', 'Projects'] as const;
  readonly priorities: readonly Priority[] = ['high', 'medium', 'low'] as const;

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.todoService.setSearchQuery(input.value);
  }

  clearSearch(): void {
    this.todoService.setSearchQuery('');
  }

  setStatus(status: 'all' | 'active' | 'completed'): void {
    this.todoService.setStatusFilter(status);
  }

  setCategory(category: string | null): void {
    this.todoService.setCategoryFilter(category);
  }

  setPriority(priority: Priority | null): void {
    this.todoService.setPriorityFilter(priority);
  }

  resetAll(): void {
    this.todoService.resetFilters();
  }
}
