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

  it('should render tasks sorted with overdue items appearing first', () => {
    todoService.addTodo({ title: 'Upcoming task', dueDate: '2099-01-01' });
    todoService.addTodo({ title: 'Overdue task', dueDate: '2020-01-01' });
    fixture.detectChanges();

    const titles = fixture.nativeElement.querySelectorAll('.task-title');
    expect(titles.length).toBe(2);
    expect(titles[0].textContent).toContain('Overdue task');
    expect(titles[1].textContent).toContain('Upcoming task');
  });

  it('should render filter controls and filter task cards dynamically', () => {
    todoService.addTodo({ title: 'Buy milk', category: 'Personal' });
    todoService.addTodo({ title: 'Write tests', category: 'Work' });
    fixture.detectChanges();

    const filterControls = fixture.nativeElement.querySelector('app-filter-controls');
    expect(filterControls).not.toBeNull();

    todoService.setSearchQuery('milk');
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-task-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Buy milk');
  });

  it('should render contextual no-matches empty state when filters yield zero results and allow reset', () => {
    todoService.addTodo({ title: 'Task 1' });
    fixture.detectChanges();

    todoService.setSearchQuery('non-existent');
    fixture.detectChanges();

    const noMatchesCard = fixture.nativeElement.querySelector('[data-testid="no-matches-state"]');
    expect(noMatchesCard).not.toBeNull();
    expect(noMatchesCard.textContent).toContain('No matching tasks found');

    const clearBtn = noMatchesCard.querySelector('button');
    clearBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="no-matches-state"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(1);
  });

  it('should transition to empty state when all tasks are deleted via task card', () => {
    const task = todoService.addTodo({ title: 'Task to be deleted' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="empty-state"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(1);

    // Click delete button and confirm
    const deleteBtn = fixture.nativeElement.querySelector('.delete-btn') as HTMLButtonElement;
    deleteBtn.click();
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector('.confirm-delete-btn') as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();

    expect(todoService.todos().length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-testid="empty-state"]')).not.toBeNull();
  });

  it('should dynamically re-sort tasks when a task due date is edited in place', () => {
    todoService.addTodo({ title: 'Upcoming Task', dueDate: '2099-01-01' });
    todoService.addTodo({ title: 'Standard Task' });
    fixture.detectChanges();

    let titles = fixture.nativeElement.querySelectorAll('.task-title');
    expect(titles[0].textContent).toContain('Upcoming Task');
    expect(titles[1].textContent).toContain('Standard Task');

    // Edit Standard Task's due date to be in the past (overdue)
    const taskCards = fixture.nativeElement.querySelectorAll('app-task-card');
    const standardCardEditBtn = taskCards[1].querySelector('.edit-btn') as HTMLButtonElement;
    standardCardEditBtn.click();
    fixture.detectChanges();

    const dueDateInput = fixture.nativeElement.querySelector('.edit-due-date-input') as HTMLInputElement;
    dueDateInput.value = '2020-01-01';
    dueDateInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const saveBtn = fixture.nativeElement.querySelector('.save-edit-btn') as HTMLButtonElement;
    saveBtn.click();
    fixture.detectChanges();

    // Now Standard Task is overdue, so it moves ahead of Upcoming Task
    titles = fixture.nativeElement.querySelectorAll('.task-title');
    expect(titles[0].textContent).toContain('Standard Task');
    expect(titles[1].textContent).toContain('Upcoming Task');
  });
});
