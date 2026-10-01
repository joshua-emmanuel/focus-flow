import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let doc: Document;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
    doc = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    localStorage.clear();
    doc.documentElement.classList.remove('dark');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with system if no stored preference exists', () => {
    expect(service.theme()).toBe('system');
  });

  it('should load stored theme from localStorage if valid', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const newService = TestBed.runInInjectionContext(() => new ThemeService());
    expect(newService.theme()).toBe('dark');
    expect(newService.isDark()).toBe(true);
  });

  it('should set theme to dark and update localStorage and root class', () => {
    service.setTheme('dark');
    TestBed.flushEffects();

    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(doc.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should set theme to light and update localStorage and remove root class', () => {
    service.setTheme('dark');
    TestBed.flushEffects();
    expect(doc.documentElement.classList.contains('dark')).toBe(true);

    service.setTheme('light');
    TestBed.flushEffects();

    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(doc.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should toggle theme between light and dark', () => {
    service.setTheme('light');
    TestBed.flushEffects();
    expect(service.isDark()).toBe(false);

    service.toggleTheme();
    TestBed.flushEffects();
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(doc.documentElement.classList.contains('dark')).toBe(true);

    service.toggleTheme();
    TestBed.flushEffects();
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(doc.documentElement.classList.contains('dark')).toBe(false);
  });
});
