import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickAddComponent } from './quick-add.component';
import { TodoService } from '../../services/todo.service';

describe('QuickAddComponent', () => {
  let component: QuickAddComponent;
  let fixture: ComponentFixture<QuickAddComponent>;
  let todoService: TodoService;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [QuickAddComponent],
      providers: [TodoService],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickAddComponent);
    component = fixture.componentInstance;
    todoService = TestBed.inject(TodoService);
    fixture.detectChanges();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default priority "medium" and empty title', () => {
    expect(component.title()).toBe('');
    expect(component.priority()).toBe('medium');
    expect(component.category()).toBe('Work');
    expect(component.errorMessage()).toBeNull();
  });

  it('should update priority when priority button is clicked', () => {
    component.setPriority('high');
    expect(component.priority()).toBe('high');

    component.setPriority('low');
    expect(component.priority()).toBe('low');
  });

  it('should display error message and not add task if title is empty or whitespace', () => {
    component.title.set('    ');
    component.onSubmit();

    expect(component.errorMessage()).toContain('cannot be empty');
    expect(todoService.todos().length).toBe(0);
  });

  it('should add task to TodoService and reset title on valid submit', () => {
    component.title.set('Prepare sprint demo');
    component.setPriority('high');
    component.category.set('Work');

    component.onSubmit();

    expect(component.errorMessage()).toBeNull();
    expect(component.title()).toBe('');
    expect(todoService.todos().length).toBe(1);
    expect(todoService.todos()[0].title).toBe('Prepare sprint demo');
    expect(todoService.todos()[0].priority).toBe('high');
    expect(todoService.todos()[0].category).toBe('Work');
  });

  it('should clear error message when user begins typing new input', () => {
    component.title.set('');
    component.onSubmit();
    expect(component.errorMessage()).not.toBeNull();

    const inputEvent = { target: { value: 'A' } } as unknown as Event;
    component.onTitleInput(inputEvent);

    expect(component.errorMessage()).toBeNull();
    expect(component.title()).toBe('A');
  });
});
