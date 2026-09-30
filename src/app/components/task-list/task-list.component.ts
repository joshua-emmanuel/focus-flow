import { Component, inject } from '@angular/core';
import { TodoService } from '../../services/todo.service';
import { TaskCardComponent } from '../task-card/task-card.component';
import { FilterControlsComponent } from '../filter-controls/filter-controls.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [TaskCardComponent, FilterControlsComponent],
  templateUrl: './task-list.component.html',
})
export class TaskListComponent {
  protected readonly todoService = inject(TodoService);
}
