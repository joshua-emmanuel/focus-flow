import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TodoService } from './services/todo.service';
import { ThemeService } from './services/theme.service';

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

  it('should activate upcoming filter when upcoming smart view is clicked in sidebar', async () => {
    const fixture = TestBed.createComponent(App);
    const todoService = TestBed.inject(TodoService);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const upcomingItem = compiled.querySelector('.upcoming-smart-view') as HTMLElement;
    expect(upcomingItem).not.toBeNull();

    upcomingItem.click();
    fixture.detectChanges();

    expect(todoService.filterState().statusFilter).toBe('upcoming');
    expect(todoService.filterState().categoryFilter).toBeNull();
  });

  it('should render CadenceCardComponent and reflect real-time metrics across app', async () => {
    const fixture = TestBed.createComponent(App);
    const todoService = TestBed.inject(TodoService);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const cadenceCard = compiled.querySelector('app-cadence-card');
    expect(cadenceCard).not.toBeNull();

    // Add tasks and verify cadence card reflects active count and completion
    const t1 = todoService.addTodo({ title: 'Task Alpha' });
    const t2 = todoService.addTodo({ title: 'Task Beta' });
    fixture.detectChanges();

    expect(cadenceCard?.querySelector('.active-tasks-title')?.textContent).toContain('2 Active Tasks Left');
    expect(cadenceCard?.querySelector('.fraction-label')?.textContent).toContain('0 / 2 Done');

    // Complete t1
    todoService.toggleTodo(t1.id);
    fixture.detectChanges();

    expect(cadenceCard?.querySelector('.active-tasks-title')?.textContent).toContain('1 Active Task Left');
    expect(cadenceCard?.querySelector('.fraction-label')?.textContent).toContain('1 / 2 Done');
    expect(cadenceCard?.querySelector('.cadence-subtitle')?.textContent).toContain('50% daily cadence finished');

    // Clear completed via cadence card
    const clearBtn = cadenceCard?.querySelector('.clear-done-btn') as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();

    const confirmBtn = cadenceCard?.querySelector('.confirm-clear-btn') as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();

    expect(todoService.todos().length).toBe(1);
    expect(cadenceCard?.querySelector('.active-tasks-title')?.textContent).toContain('1 Active Task Left');
    expect(cadenceCard?.querySelector('.fraction-label')?.textContent).toContain('0 / 1 Done');
  });

  it('should toggle theme when theme toggle button in header is clicked', async () => {
    const fixture = TestBed.createComponent(App);
    const themeService = TestBed.inject(ThemeService);
    themeService.setTheme('light');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const themeBtn = compiled.querySelector('.theme-toggle-btn') as HTMLButtonElement;
    expect(themeBtn).not.toBeNull();
    expect(themeBtn.getAttribute('aria-label')).toBe('Switch to dark mode');

    themeBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(themeService.isDark()).toBe(true);
    expect(themeBtn.getAttribute('aria-label')).toBe('Switch to light mode');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    themeBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(themeService.isDark()).toBe(false);
    expect(themeBtn.getAttribute('aria-label')).toBe('Switch to dark mode');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
