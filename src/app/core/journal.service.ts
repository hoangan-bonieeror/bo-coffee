import { Injectable, computed, signal } from '@angular/core';
import { Bean, BrewLog, JournalBackup, SCHEMA_VERSION, parseBackup } from './journal';

const DB_NAME = 'bo-coffee';
const DB_VERSION = 1;
type StoreName = 'beans' | 'brews';

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('beans')) db.createObjectStore('beans', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('brews')) {
        const s = db.createObjectStore('brews', { keyPath: 'id' });
        s.createIndex('brewedAt', 'brewedAt');
        s.createIndex('beanId', 'beanId');
      }
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

/**
 * Bean shelf + brew log, kept in IndexedDB in this browser.
 * The whole journal is mirrored in signals (it stays small: thousands of rows at most),
 * so pages can filter and compute stats synchronously. If IndexedDB is unavailable
 * (private mode in some browsers, tests) the journal works in memory for the session.
 */
@Injectable({ providedIn: 'root' })
export class JournalService {
  private dbPromise: Promise<IDBDatabase | null> =
    typeof indexedDB === 'undefined' ? Promise.resolve(null) : openDb().catch(() => null);

  private readonly _beans = signal<Bean[]>([]);
  private readonly _brews = signal<BrewLog[]>([]);
  readonly ready = signal(false);
  readonly persistent = signal(false);

  readonly beans = computed(() =>
    [...this._beans()].sort(
      (a, b) =>
        Number(a.archived) - Number(b.archived) ||
        (b.roastDate ?? '').localeCompare(a.roastDate ?? ''),
    ),
  );
  readonly activeBeans = computed(() => this.beans().filter((b) => !b.archived));
  /** Newest first */
  readonly brews = computed(() =>
    [...this._brews()].sort((a, b) => b.brewedAt.localeCompare(a.brewedAt)),
  );
  readonly beanById = computed(() => new Map(this._beans().map((b) => [b.id, b])));
  readonly brewById = computed(() => new Map(this._brews().map((b) => [b.id, b])));

  constructor() {
    this.load();
  }

  private async load() {
    const db = await this.dbPromise;
    if (db) {
      const tx = db.transaction(['beans', 'brews'], 'readonly');
      const [beans, brews] = await Promise.all([
        req(tx.objectStore('beans').getAll() as IDBRequest<Bean[]>),
        req(tx.objectStore('brews').getAll() as IDBRequest<BrewLog[]>),
      ]);
      this._beans.set(beans);
      this._brews.set(brews);
      // Ask the browser not to evict the journal under storage pressure.
      navigator.storage
        ?.persist?.()
        .then((ok) => this.persistent.set(ok))
        .catch(() => undefined);
    }
    this.ready.set(true);
  }

  private async put(store: StoreName, value: Bean | BrewLog) {
    const db = await this.dbPromise;
    if (!db) return;
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    await done(tx);
  }

  private async remove(store: StoreName, id: string) {
    const db = await this.dbPromise;
    if (!db) return;
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    await done(tx);
  }

  async saveBean(bean: Bean) {
    this._beans.update((list) => [...list.filter((b) => b.id !== bean.id), bean]);
    await this.put('beans', bean);
  }

  async deleteBean(id: string) {
    this._beans.update((list) => list.filter((b) => b.id !== id));
    // Keep the brews, just detach them from the bean.
    const orphaned = this._brews().filter((b) => b.beanId === id);
    for (const b of orphaned) await this.saveBrew({ ...b, beanId: undefined });
    await this.remove('beans', id);
  }

  async saveBrew(brew: BrewLog) {
    this._brews.update((list) => [...list.filter((b) => b.id !== brew.id), brew]);
    await this.put('brews', brew);
  }

  async deleteBrew(id: string) {
    this._brews.update((list) => list.filter((b) => b.id !== id));
    await this.remove('brews', id);
  }

  exportBackup(): JournalBackup {
    return {
      app: 'bo-coffee',
      schemaVersion: SCHEMA_VERSION,
      exported: new Date().toISOString(),
      beans: this._beans(),
      brews: this._brews(),
    };
  }

  /** Merge a backup into the journal (same id = replaced). Returns counts imported. */
  async importBackup(text: string): Promise<{ beans: number; brews: number }> {
    const data = parseBackup(text);
    for (const b of data.beans) await this.saveBean(b);
    for (const b of data.brews) await this.saveBrew(b);
    return { beans: data.beans.length, brews: data.brews.length };
  }

  async clearAll() {
    this._beans.set([]);
    this._brews.set([]);
    const db = await this.dbPromise;
    if (!db) return;
    const tx = db.transaction(['beans', 'brews'], 'readwrite');
    tx.objectStore('beans').clear();
    tx.objectStore('brews').clear();
    await done(tx);
  }
}
