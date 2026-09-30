import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { Todo } from '../../models/todo.model';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;

  const mockTask: Todo = {
    id: 't-123',
    title: 'Complete wireframes',
    completed: false,
    priority: 'high',
    dueDate: '2026-10-24',
    category: 'Work',
    createdAt: '2026-09-30T06:00:00.000Zk',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('task', mockTask);
    fixture.detectChanges();
  });

  it('should create the task card', () => {
    expect(component).toBeTruthy();
  });

  it('should render task details and badge classes correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.task-title')?.textContent).toContain('Complete wireframes');
    expect(compiled.querySelector('.badge-high')?.textContent).toContain('high');
    expect(compiled.querySelector('.badge-work')?.textContent).toContain('Work');
    expect(compiled.querySelector('.due-date-pill')?.textContent).toContain('2026-10-24');
  });

  it('should emit toggle event with task id when checkbox changes', () => {
    let emittedId = '';
    component.toggle.subscribe((id: string) => {
      emittedId = id;
    });

    const checkbox = fixture.nativeElement.querySelector('.task-checkbox') as HTMLInputElement;
    checkbox.click();

    expect(emittedId).toBe('t-123');
  });

  it('should apply is-completed class when task is completed', () => {
    const completedTask: Todo = { ...mockTask, completed: true };
    fixture.componentRef.setInput('task', completedTask);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.task-card');
    expect(card.classList.contains('is-completed')).toBe(true);
  });

  it('should display overdue badge and red border when task is overdue', () => {
    const overdueTask: Todo = {
      ...mockTask,
      dueDate: '2020-01-01',
      completed: false,
    };
    fixture.componentRef.setInput('task', overdueTask);
    fixture.detectChanges();

    expect(component.isOverdue()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    const overdueBadge = compiled.querySelector('.badge-overdue');
    expect(overdueBadge).not.toBeNull();
    expect(overdueBadge?.textContent).toContain('Overdue');

    const card = compiled.querySelector('.task-card');
    expect(card?.classList.contains('border-l-4')).toBe(true);
    expect(card?.classList.contains('border-l-rose-500')).toBe(true);
  });

  it('should not display overdue badge when task is completed even if dueDate is in the past', () => {
    const completedPastTask: Todo = {
      ...mockTask,
      dueDate: '2020-01-01',
      completed: true,
    };
    fixture.componentRef.setInput('task', completedPastTask);
    fixture.detectChanges();

    expect(component.isOverdue()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    const overdueBadge = compiled.querySelector('.badge-overdue');
    expect(overdueBadge).toBeNull();

    const card = compiled.querySelector('.task-card');
    expect(card?.classList.contains('border-l-rose-500')).toBe(false);
  });
});
