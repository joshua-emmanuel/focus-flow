import { TestBed } from '@angular/core/testing';
import { App } from './app';

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
});
