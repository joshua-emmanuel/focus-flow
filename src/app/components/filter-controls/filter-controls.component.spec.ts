import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterControlsComponent } from './filter-controls.component';
import { TodoService } from '../../services/todo.service';

describe('FilterControlsComponent', () => {
  let component: FilterControlsComponent;
  let fixture: ComponentFixture<FilterControlsComponent>;
  let todoService: TodoService;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FilterControlsComponent],
      providers: [TodoService],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterControlsComponent);
    component = fixture.componentInstance;
    todoService = TestBed.inject(TodoService);
    fixture.detectChanges();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should create the filter controls component', () => {
    expect(component).toBeTruthy();
  });

  it('should update search query in TodoService when typing into input', () => {
    const input = fixture.nativeElement.querySelector('.search-input') as HTMLInputElement;
    input.value = 'meeting';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(todoService.filterState().searchQuery).toBe('meeting');
  });

  it('should clear search query when clear button is clicked', () => {
    todoService.setSearchQuery('initial query');
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.clear-search-btn') as HTMLButtonElement;
    expect(clearBtn).not.toBeNull();

    clearBtn.click();
    fixture.detectChanges();

    expect(todoService.filterState().searchQuery).toBe('');
  });

  it('should update status filter when status tabs are clicked', () => {
    const tabs = fixture.nativeElement.querySelectorAll('.status-tab') as NodeListOf<HTMLButtonElement>;
    expect(tabs.length).toBe(3); // All, Active, Completed

    // Click "Active" (second tab)
    tabs[1].click();
    fixture.detectChanges();
    expect(todoService.filterState().statusFilter).toBe('active');

    // Click "Completed" (third tab)
    tabs[2].click();
    fixture.detectChanges();
    expect(todoService.filterState().statusFilter).toBe('completed');

    // Click "All" (first tab)
    tabs[0].click();
    fixture.detectChanges();
    expect(todoService.filterState().statusFilter).toBe('all');
  });

  it('should update category filter when category chips are clicked', () => {
    const catChips = fixture.nativeElement.querySelectorAll('.cat-chip') as NodeListOf<HTMLButtonElement>;
    expect(catChips.length).toBeGreaterThan(1);

    // Click "Work" (second chip: All, Work, Personal, Projects)
    catChips[1].click();
    fixture.detectChanges();
    expect(todoService.filterState().categoryFilter).toBe('Work');

    // Click "All" (first chip)
    catChips[0].click();
    fixture.detectChanges();
    expect(todoService.filterState().categoryFilter).toBeNull();
  });

  it('should update priority filter when priority chips are clicked', () => {
    const prioChips = fixture.nativeElement.querySelectorAll('.prio-chip') as NodeListOf<HTMLButtonElement>;
    expect(prioChips.length).toBeGreaterThan(1);

    // Click "High" (second chip: All, High, Medium, Low)
    prioChips[1].click();
    fixture.detectChanges();
    expect(todoService.filterState().priorityFilter).toBe('high');

    // Click "All" (first chip)
    prioChips[0].click();
    fixture.detectChanges();
    expect(todoService.filterState().priorityFilter).toBeNull();
  });

  it('should display reset button when filters are active and reset all on click', () => {
    expect(fixture.nativeElement.querySelector('.reset-filters-btn')).toBeNull();

    todoService.setCategoryFilter('Personal');
    fixture.detectChanges();

    const resetBtn = fixture.nativeElement.querySelector('.reset-filters-btn') as HTMLButtonElement;
    expect(resetBtn).not.toBeNull();

    resetBtn.click();
    fixture.detectChanges();

    expect(todoService.isFiltered()).toBe(false);
    expect(todoService.filterState().categoryFilter).toBeNull();
  });
});
