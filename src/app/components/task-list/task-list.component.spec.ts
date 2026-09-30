import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskListComponent } from './task-list.component';
import { TodoService } from '../../services/todo.service';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let todoService: TodoService;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [TodoService],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    todoService = TestBed.inject(TodoService);
    fixture.detectChanges();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should create the task list component', () => {
    expect(component).toBeTruthy();
  });

  it('should render empty state when no tasks exist', () => {
    const emptyCard = fixture.nativeElement.querySelector('[data-testid="empty-state"]');
    expect(emptyCard).not.toBeNull();
    expect(emptyCard.textContent).toContain('All tasks completed!');
  });

  it('should render task cards when tasks are present in TodoService', () => {
    todoService.addTodo({ title: 'Task A', priority: 'high', category: 'Work' });
    todoService.addTodo({ title: 'Task B', priority: 'low', category: 'Personal' });
    fixture.detectChanges();

    const emptyCard = fixture.nativeElement.querySelector('[data-testid="empty-state"]');
    expect(emptyCard).toBeNull();

    const taskCards = fixture.nativeElement.querySelectorAll('app-task-card');
    expect(taskCards.length).toBe(2);
  });

  it('should toggle task completion when task card emits toggle', () => {
    const task = todoService.addTodo({ title: 'Toggle test task' });
    fixture.detectChanges();

    expect(todoService.todos()[0].completed).toBe(false);

    const checkbox = fixture.nativeElement.querySelector('.task-checkbox') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();

    expect(todoService.todos()[0].completed).toBe(true);
  });
});
