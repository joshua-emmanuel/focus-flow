import { Component, inject, signal } from '@angular/core';
import { TodoService } from './services/todo.service';
import { CadenceCardComponent } from './components/cadence-card/cadence-card.component';
import { QuickAddComponent } from './components/quick-add/quick-add.component';
import { TaskListComponent } from './components/task-list/task-list.component';

@Component({
  selector: 'app-root',
  imports: [CadenceCardComponent, QuickAddComponent, TaskListComponent],
  templateUrl: './app.html',
})
export class App {
  protected readonly todoService = inject(TodoService);
  protected readonly title = signal('FocusFlow');
  protected readonly isMobileMenuOpen = signal(false);

  protected readonly todayDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  protected readonly fullDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
