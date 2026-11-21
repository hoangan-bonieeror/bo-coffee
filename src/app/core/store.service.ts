import { Injectable, computed, effect, signal } from '@angular/core';
import { AppState, Lang, Settings, Theme } from './models';

const STORAGE_KEY = 'bo-coffee.reader.v1';

function detectLang(): Lang {
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('vi')
    ? 'vi'
    : 'en';
}

/** Follow the OS on first visit; the warm light "kraft paper" look is the default. */
function detectTheme(): Theme {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function initialState(): AppState {
  return {
    version: 2,
    settings: { lang: detectLang(), theme: detectTheme() },
    read: {},
    bookmarks: {},
    notes: {},
  };
}

function normalize(raw: unknown): AppState {
  const base = initialState();
  if (!raw || typeof raw !== 'object') return base;
  const s = raw as Partial<AppState>;
  return {
    version: 2,
    settings: { ...base.settings, ...(s.settings ?? {}) },
    read: s.read ?? {},
    bookmarks: s.bookmarks ?? {},
    notes: s.notes ?? {},
  };
}

/**
 * Reader state: language/theme, read history, bookmarks and personal notes.
 * Stored in localStorage; exportable as JSON from the Saved page.
 */
@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly _state = signal<AppState>(this.load());
  readonly state = this._state.asReadonly();
  readonly settings = computed(() => this._state().settings);
  readonly lang = computed(() => this._state().settings.lang);
  readonly bookmarkCount = computed(() => Object.keys(this._state().bookmarks).length);

  constructor() {
    effect(() => {
      const s = this._state();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {
        /* storage disabled: keep in memory */
      }
    });
    effect(() => {
      const { theme, lang } = this._state().settings;
      document.documentElement.dataset['theme'] = theme;
      document.documentElement.lang = lang;
    });
  }

  private load(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch {
      /* fall through */
    }
    return initialState();
  }

  updateSettings(patch: Partial<Settings>) {
    this._state.update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }

  toggleTheme() {
    this.updateSettings({ theme: this.settings().theme === 'dark' ? 'light' : 'dark' });
  }

  markRead(id: string) {
    if (this._state().read[id]) return;
    this._state.update((s) => ({ ...s, read: { ...s.read, [id]: new Date().toISOString() } }));
  }

  toggleBookmark(id: string) {
    this._state.update((s) => {
      const bookmarks = { ...s.bookmarks };
      if (bookmarks[id]) delete bookmarks[id];
      else bookmarks[id] = new Date().toISOString();
      return { ...s, bookmarks };
    });
  }

  saveNote(id: string, text: string) {
    this._state.update((s) => {
      const notes = { ...s.notes };
      if (text.trim()) notes[id] = { text, updated: new Date().toISOString() };
      else delete notes[id];
      return { ...s, notes };
    });
  }

  exportJson(): string {
    return JSON.stringify(this._state(), null, 2);
  }

  importJson(text: string) {
    const parsed = JSON.parse(text);
    if (!parsed || parsed.version !== 2) throw new Error('Invalid backup file');
    this._state.set(normalize(parsed));
  }

  reset() {
    const { lang, theme } = this.settings();
    this._state.set({ ...initialState(), settings: { lang, theme } });
  }
}
