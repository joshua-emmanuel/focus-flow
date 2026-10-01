import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'focusflow_theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly _theme = signal<ThemeMode>(this.loadStoredTheme());
  private readonly _systemPrefersDark = signal<boolean>(this.checkSystemPrefersDark());

  readonly theme = this._theme.asReadonly();

  /**
   * Computed boolean representing whether the dark theme is actively applied.
   */
  readonly isDark = computed<boolean>(() => {
    const currentTheme = this._theme();
    if (currentTheme === 'dark') {
      return true;
    }
    if (currentTheme === 'light') {
      return false;
    }
    return this._systemPrefersDark();
  });

  constructor() {
    this.setupSystemThemeListener();
    this.applyThemeClass(this.isDark());

    // Effect to keep documentElement class synchronized with isDark signal
    effect(() => {
      const dark = this.isDark();
      this.applyThemeClass(dark);
    });
  }

  setTheme(mode: ThemeMode): void {
    this._theme.set(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Gracefully handle restricted storage
    }
    this.applyThemeClass(this.isDark());
  }

  /**
   * Toggles theme: if actively dark, switch to 'light'; if light, switch to 'dark'.
   */
  toggleTheme(): void {
    if (this.isDark()) {
      this.setTheme('light');
    } else {
      this.setTheme('dark');
    }
  }

  private loadStoredTheme(): ThemeMode {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // Graceful fallback
    }
    return 'system';
  }

  private checkSystemPrefersDark(): boolean {
    try {
      const win = this.document.defaultView;
      if (win && typeof win.matchMedia === 'function') {
        return win.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch {
      // Fallback
    }
    return false;
  }

  private setupSystemThemeListener(): void {
    try {
      const win = this.document.defaultView;
      if (win && typeof win.matchMedia === 'function') {
        const mq = win.matchMedia('(prefers-color-scheme: dark)');
        const listener = (event: MediaQueryListEvent) => {
          this._systemPrefersDark.set(event.matches);
          this.applyThemeClass(this.isDark());
        };
        if (typeof mq.addEventListener === 'function') {
          mq.addEventListener('change', listener);
        } else if (typeof (mq as any).addListener === 'function') {
          (mq as any).addListener(listener);
        }
      }
    } catch {
      // Fallback if media query listener cannot be registered
    }
  }

  private applyThemeClass(isDark: boolean): void {
    const root = this.document.documentElement;
    const isCurrentlyDark = root.classList.contains('dark');
    if (isCurrentlyDark === isDark) {
      return;
    }

    const doc = this.document;
    const win = doc.defaultView;

    let cleanup: (() => void) | null = null;
    if (doc.head && win && typeof doc.createElement === 'function') {
      try {
        const existing = doc.getElementById('focusflow-disable-transitions');
        if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing);
        }

        const style = doc.createElement('style');
        style.setAttribute('id', 'focusflow-disable-transitions');
        style.textContent = `
          *, *::before, *::after {
            -webkit-transition: none !important;
            -moz-transition: none !important;
            -o-transition: none !important;
            -ms-transition: none !important;
            transition: none !important;
          }
        `;
        doc.head.appendChild(style);

        cleanup = () => {
          if (doc.body && typeof win.getComputedStyle === 'function') {
            void win.getComputedStyle(doc.body).opacity;
          }
          setTimeout(() => {
            if (style.parentNode) {
              style.parentNode.removeChild(style);
            }
          }, 20);
        };
      } catch {
        // Fallback for restricted environments
      }
    }

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (cleanup) {
      cleanup();
    }
  }
}
