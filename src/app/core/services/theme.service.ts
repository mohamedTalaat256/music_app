import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { ThemeMode } from '../../shared/models';

/**
 * Applies the active colour theme to the document root and reacts to the OS
 * colour-scheme when the user selects "system".
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly mode = signal<ThemeMode>('system');
  private readonly systemDark = signal<boolean>(this.prefersDark());

  /** The concrete theme currently rendered ('light' | 'dark'). */
  readonly resolved = signal<'light' | 'dark'>('light');

  constructor() {
    const media = this.window?.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener('change', (e) => this.systemDark.set(e.matches));

    effect(() => {
      const mode = this.mode();
      const resolved =
        mode === 'system' ? (this.systemDark() ? 'dark' : 'light') : mode;
      this.resolved.set(resolved);
      const root = this.document.documentElement;
      root.setAttribute('data-theme', resolved);
      root.style.colorScheme = resolved;
    });
  }

  setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  private prefersDark(): boolean {
    return (
      this.window?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    );
  }

  private get window(): (Window & typeof globalThis) | null {
    return this.document.defaultView;
  }
}
