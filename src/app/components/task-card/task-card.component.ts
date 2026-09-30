import { Component, computed, input, output } from '@angular/core';
import { Todo } from '../../models/todo.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [],
  templateUrl: './task-card.component.html',
})
export class TaskCardComponent {
  readonly task = input.required<Todo>();
  readonly toggle = output<string>();

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
}
