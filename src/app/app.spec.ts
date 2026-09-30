import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TodoService } from './services/todo.service';

describe('App Component', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render FocusFlow brand in the sidebar', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand-text h1')?.textContent).toContain('FocusFlow');
  });

  it('should toggle mobile menu state', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app['isMobileMenuOpen']()).toBe(false);

    app.toggleMobileMenu();
    expect(app['isMobileMenuOpen']()).toBe(true);

    app.closeMobileMenu();
    expect(app['isMobileMenuOpen']()).toBe(false);
  });

  it('should render overdue warning chip in header when overdue tasks exist', async () => {
    const fixture = TestBed.createComponent(App);
    const todoService = TestBed.inject(TodoService);
    todoService.addTodo({ title: 'Overdue task', dueDate: '2020-01-01' });
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const overdueChip = compiled.querySelector('.overdue-chip');
    expect(overdueChip).not.toBeNull();
    expect(overdueChip?.textContent).toContain('1 Overdue');
  });

  it('should update category filter when a sidebar list item is clicked', async () => {
    const fixture = TestBed.createComponent(App);
    const todoService = TestBed.inject(TodoService);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const workItem = Array.from(compiled.querySelectorAll('li')).find((li) =>
      li.textContent?.includes('Work')
    );
    expect(workItem).toBeDefined();

    workItem?.click();
    fixture.detectChanges();

    expect(todoService.filterState().categoryFilter).toBe('Work');
  });
});
