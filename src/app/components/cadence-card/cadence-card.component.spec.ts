import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CadenceCardComponent } from './cadence-card.component';
import { TodoService } from '../../services/todo.service';
import { vi } from 'vitest';

describe('CadenceCardComponent', () => {
  let component: CadenceCardComponent;
  let fixture: ComponentFixture<CadenceCardComponent>;
  let todoService: TodoService;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CadenceCardComponent],
      providers: [TodoService],
    }).compileComponents();

    fixture = TestBed.createComponent(CadenceCardComponent);
    component = fixture.componentInstance;
    todoService = TestBed.inject(TodoService);
    fixture.detectChanges();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should create the cadence card component', () => {
    expect(component).toBeTruthy();
  });

  it('should display "All Caught Up!" and 0% when no tasks exist', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.active-tasks-title')?.textContent).toContain('All Caught Up!');
    expect(compiled.querySelector('.cadence-subtitle')?.textContent).toContain('0% daily cadence finished');
    expect(compiled.querySelector('.fraction-label')?.textContent).toContain('0 / 0 Done');

    const progressBar = compiled.querySelector('.progress-bar-fill') as HTMLElement;
    expect(progressBar.style.width).toBe('0%');
  });

  it('should display correct active task count and completion percentage when tasks exist', () => {
    const t1 = todoService.addTodo({ title: 'Task 1' });
    const t2 = todoService.addTodo({ title: 'Task 2' });
    const t3 = todoService.addTodo({ title: 'Task 3' });
    const t4 = todoService.addTodo({ title: 'Task 4' });

    // Mark 1 of 4 completed (25%)
    todoService.toggleTodo(t1.id);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.active-tasks-title')?.textContent).toContain('3 Active Tasks Left');
    expect(compiled.querySelector('.cadence-subtitle')?.textContent).toContain('25% daily cadence finished');
    expect(compiled.querySelector('.fraction-label')?.textContent).toContain('1 / 4 Done');

    const progressBar = compiled.querySelector('.progress-bar-fill') as HTMLElement;
    expect(progressBar.style.width).toBe('25%');
  });

  it('should disable Clear Done button when there are no completed tasks', () => {
    todoService.addTodo({ title: 'Active task' });
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.clear-done-btn') as HTMLButtonElement;
    expect(clearBtn.disabled).toBe(true);
  });

  it('should enable Clear Done button when completed tasks exist', () => {
    const task = todoService.addTodo({ title: 'Completed task' });
    todoService.toggleTodo(task.id);
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.clear-done-btn') as HTMLButtonElement;
    expect(clearBtn.disabled).toBe(false);
  });

  it('should toggle confirmation box on Clear Done click and allow cancel', () => {
    const clearSpy = vi.spyOn(todoService, 'clearCompleted');
    const task = todoService.addTodo({ title: 'Completed task' });
    todoService.toggleTodo(task.id);
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.clear-done-btn') as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();

    expect(component.isConfirmingClear()).toBe(true);
    expect(fixture.nativeElement.querySelector('.clear-confirm-box')).not.toBeNull();

    // Click No to cancel
    const cancelBtn = fixture.nativeElement.querySelector('.cancel-clear-btn') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    expect(component.isConfirmingClear()).toBe(false);
    expect(clearSpy).not.toHaveBeenCalled();
    expect(todoService.completedTodosCount()).toBe(1);
  });

  it('should call clearCompleted on confirmation and update state', () => {
    const clearSpy = vi.spyOn(todoService, 'clearCompleted');
    const t1 = todoService.addTodo({ title: 'Task 1' });
    const t2 = todoService.addTodo({ title: 'Task 2' });
    todoService.toggleTodo(t1.id);
    fixture.detectChanges();

    expect(todoService.completedTodosCount()).toBe(1);
    expect(todoService.activeTodosCount()).toBe(1);

    component.startClear();
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector('.confirm-clear-btn') as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();

    expect(clearSpy).toHaveBeenCalled();
    expect(component.isConfirmingClear()).toBe(false);
    expect(todoService.completedTodosCount()).toBe(0);
    expect(todoService.activeTodosCount()).toBe(1);
  });
});
