import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { Todo } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';
import { vi } from 'vitest';

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

  it('should toggle delete confirmation state and call deleteTodo on confirm', () => {
    const todoService = TestBed.inject(TodoService);
    const deleteSpy = vi.spyOn(todoService, 'deleteTodo');

    expect(component.isConfirmingDelete()).toBe(false);

    // Click delete button to enter confirmation mode
    const deleteBtn = fixture.nativeElement.querySelector('.delete-btn') as HTMLButtonElement;
    deleteBtn.click();
    fixture.detectChanges();

    expect(component.isConfirmingDelete()).toBe(true);
    expect(fixture.nativeElement.querySelector('.delete-confirm-box')).not.toBeNull();

    // Cancel deletion
    const cancelBtn = fixture.nativeElement.querySelector('.cancel-delete-btn') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    expect(component.isConfirmingDelete()).toBe(false);
    expect(deleteSpy).not.toHaveBeenCalled();

    // Re-enter and confirm deletion
    component.startDelete();
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector('.confirm-delete-btn') as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();

    expect(deleteSpy).toHaveBeenCalledWith('t-123');
    expect(component.isConfirmingDelete()).toBe(false);
  });

  it('should enter inline edit mode and populate inputs with task data', () => {
    expect(component.isEditing()).toBe(false);

    const editBtn = fixture.nativeElement.querySelector('.edit-btn') as HTMLButtonElement;
    editBtn.click();
    fixture.detectChanges();

    expect(component.isEditing()).toBe(true);
    expect(component.editTitle()).toBe('Complete wireframes');
    expect(component.editPriority()).toBe('high');
    expect(component.editCategory()).toBe('Work');
    expect(component.editDueDate()).toBe('2026-10-24');

    const compiled = fixture.nativeElement as HTMLElement;
    const titleInput = compiled.querySelector('.edit-title-input') as HTMLInputElement;
    expect(titleInput).not.toBeNull();
    expect(titleInput.value).toBe('Complete wireframes');

    const prioritySelect = compiled.querySelector('.edit-priority-select') as HTMLSelectElement;
    expect(prioritySelect.value).toBe('high');

    const categorySelect = compiled.querySelector('.edit-category-select') as HTMLSelectElement;
    expect(categorySelect.value).toBe('Work');

    const dueDateInput = compiled.querySelector('.edit-due-date-input') as HTMLInputElement;
    expect(dueDateInput.value).toBe('2026-10-24');
  });

  it('should cancel edit mode when Cancel button is clicked', () => {
    component.startEdit();
    fixture.detectChanges();
    expect(component.isEditing()).toBe(true);

    const cancelBtn = fixture.nativeElement.querySelector('.cancel-edit-btn') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    expect(component.isEditing()).toBe(false);
    expect(fixture.nativeElement.querySelector('.inline-edit-card')).toBeNull();
  });

  it('should display error message when saving with empty title and not call updateTodo', () => {
    const todoService = TestBed.inject(TodoService);
    const updateSpy = vi.spyOn(todoService, 'updateTodo');

    component.startEdit();
    fixture.detectChanges();

    const titleInput = fixture.nativeElement.querySelector('.edit-title-input') as HTMLInputElement;
    titleInput.value = '   ';
    titleInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveBtn = fixture.nativeElement.querySelector('.save-edit-btn') as HTMLButtonElement;
    saveBtn.click();
    fixture.detectChanges();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(component.isEditing()).toBe(true);
    expect(component.editError()).toBe('Task title cannot be empty.');

    const errorMsg = fixture.nativeElement.querySelector('.edit-error-msg');
    expect(errorMsg?.textContent).toContain('Task title cannot be empty.');
  });

  it('should call updateTodo with updated fields and exit edit mode on save', () => {
    const todoService = TestBed.inject(TodoService);
    const updateSpy = vi.spyOn(todoService, 'updateTodo');

    component.startEdit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Change title
    const titleInput = compiled.querySelector('.edit-title-input') as HTMLInputElement;
    titleInput.value = 'Revised wireframes';
    titleInput.dispatchEvent(new Event('input'));

    // Change priority
    const prioritySelect = compiled.querySelector('.edit-priority-select') as HTMLSelectElement;
    prioritySelect.value = 'low';
    prioritySelect.dispatchEvent(new Event('change'));

    // Change category
    const categorySelect = compiled.querySelector('.edit-category-select') as HTMLSelectElement;
    categorySelect.value = 'Projects';
    categorySelect.dispatchEvent(new Event('change'));

    // Change due date
    const dueDateInput = compiled.querySelector('.edit-due-date-input') as HTMLInputElement;
    dueDateInput.value = '2026-11-01';
    dueDateInput.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    const saveBtn = compiled.querySelector('.save-edit-btn') as HTMLButtonElement;
    saveBtn.click();
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith('t-123', {
      title: 'Revised wireframes',
      priority: 'low',
      category: 'Projects',
      dueDate: '2026-11-01',
    });
    expect(component.isEditing()).toBe(false);
  });

  it('should save edits on Enter key in title input', () => {
    const todoService = TestBed.inject(TodoService);
    const updateSpy = vi.spyOn(todoService, 'updateTodo');

    component.startEdit();
    fixture.detectChanges();

    const titleInput = fixture.nativeElement.querySelector('.edit-title-input') as HTMLInputElement;
    titleInput.value = 'Enter key saved title';
    titleInput.dispatchEvent(new Event('input'));
    titleInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith('t-123', {
      title: 'Enter key saved title',
      priority: 'high',
      category: 'Work',
      dueDate: '2026-10-24',
    });
    expect(component.isEditing()).toBe(false);
  });
});
