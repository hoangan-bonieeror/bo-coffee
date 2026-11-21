import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BREW_METHODS, BrewMethod, formatClock, ratioOf } from '../core/brew';
import { ContentService } from '../core/content.service';
import { FLAVOR_BY_ID } from '../core/flavors';
import { I18n } from '../core/i18n';
import { BrewLog, brewsToCsv, statsByMethod, topFlavors } from '../core/journal';
import { JournalService } from '../core/journal.service';

/** Ask for a backup after this many new brews since the last export. */
const BACKUP_EVERY = 20;
const LAST_EXPORT_KEY = 'bo-coffee.lastExportCount';

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

@Component({
  selector: 'app-brew-log',
  imports: [RouterLink],
  template: `
    <header class="page-head">
      <h1>📒 {{ i18n.t('brew.title') }}</h1>
      <p class="muted">{{ i18n.t('brew.subtitle') }}</p>
      <div class="page-actions">
        <a class="btn" routerLink="/brew/new">+ {{ i18n.t('brew.new') }}</a>
        <a class="btn ghost" routerLink="/beans">🫘 {{ i18n.t('nav.beans') }}</a>
      </div>
    </header>

    @if (needsBackup()) {
      <p class="notice">💾 {{ i18n.t('brew.backupNudge') }}</p>
    }

    @if (journal.brews().length) {
      <section class="stats-row">
        <div class="stat card">
          <span class="stat-num">{{ journal.brews().length }}</span>
          <span class="small muted">{{ i18n.t('brew.total') }}</span>
        </div>
        <div class="stat card">
          <span class="stat-num">{{ avgRating() }}★</span>
          <span class="small muted">{{ i18n.t('brew.avg') }}</span>
        </div>
        <div class="stat card wide">
          <span class="small muted">{{ i18n.t('brew.byMethod') }}</span>
          <ul class="method-bars">
            @for (s of byMethod(); track s.method) {
              <li>
                <span class="mb-name">{{ methodName(s.method) }}</span>
                <span class="mb-bar"
                  ><span [style.width.%]="(s.count / maxCount()) * 100"></span
                ></span>
                <span class="small">{{ s.count }} · {{ s.avgRating }}★</span>
              </li>
            }
          </ul>
        </div>
        @if (flavors().length) {
          <div class="stat card wide">
            <span class="small muted">{{ i18n.t('brew.topFlavors') }}</span>
            <div class="fw-chips">
              @for (f of flavors(); track f.id) {
                <span class="chip static on" [style.--fw]="f.color"
                  >{{ f.name }} · {{ f.count }}</span
                >
              }
            </div>
          </div>
        }
      </section>

      <div class="filters">
        <select
          (change)="method.set($any($event.target).value)"
          [attr.aria-label]="i18n.t('tools.method')"
        >
          <option value="">{{ i18n.t('brew.allMethods') }}</option>
          @for (m of methods; track m) {
            <option [value]="m">{{ methodName(m) }}</option>
          }
        </select>
        <select
          (change)="bean.set($any($event.target).value)"
          [attr.aria-label]="i18n.t('beans.title')"
        >
          <option value="">{{ i18n.t('brew.allBeans') }}</option>
          @for (b of journal.beans(); track b.id) {
            <option [value]="b.id">{{ b.name }}</option>
          }
        </select>
        <select
          (change)="minRating.set(+$any($event.target).value)"
          [attr.aria-label]="i18n.t('brew.rating')"
        >
          <option value="0">{{ i18n.t('brew.anyRating') }}</option>
          <option value="4">≥ 4★</option>
          <option value="5">5★</option>
        </select>
        <span class="small muted">{{ filtered().length }} / {{ journal.brews().length }}</span>
      </div>
    } @else if (journal.ready()) {
      <div class="card empty-state">
        <p>{{ i18n.t('brew.empty') }}</p>
        <a class="btn" routerLink="/tools">⏱ {{ i18n.t('home.brewNow') }}</a>
      </div>
    }

    <ul class="brew-list">
      @for (b of filtered(); track b.id) {
        <li class="card brew-row">
          <div class="brew-main">
            <span class="brew-when small muted">{{ when(b.brewedAt) }}</span>
            <strong>
              {{ methodIcon(b.method) }} {{ methodName(b.method) }}
              @if (b.beanId && journal.beanById().get(b.beanId); as bean) {
                · {{ bean.name }}
              }
            </strong>
            <span class="brew-params small">
              {{ b.coffeeG }} g → {{ b.waterG }} g · 1:{{ ratio(b) }}
              @if (b.waterTempC) {
                · {{ b.waterTempC }}°C
              }
              @if (b.grind) {
                · {{ b.grind }}
              }
              @if (b.totalSec) {
                · {{ clock(b.totalSec) }}
              }
              @if (b.tds) {
                · TDS {{ b.tds }}%
              }
            </span>
            @if (b.flavors.length) {
              <span class="fw-chips">
                @for (f of b.flavors; track f) {
                  <span class="chip static" [style.--fw]="flavorColor(f)">{{ flavorName(f) }}</span>
                }
              </span>
            }
            @if (b.comment) {
              <p class="small">{{ b.comment }}</p>
            }
            @if (b.fromPostId && content.postById().get(b.fromPostId); as post) {
              <a class="small" [routerLink]="['/p', post.id]">📖 {{ i18n.pick(post.title) }}</a>
            }
          </div>
          <div class="brew-side">
            <span class="stars" [attr.aria-label]="b.rating + '/5'">{{ stars(b.rating) }}</span>
            <a
              class="btn small-btn"
              routerLink="/tools"
              [queryParams]="{ method: b.method, coffee: b.coffeeG, water: b.waterG }"
              >↻ {{ i18n.t('brew.again') }}</a
            >
            <a class="btn ghost small-btn" [routerLink]="['/brew', b.id]">{{
              i18n.t('common.edit')
            }}</a>
            <button class="btn ghost small-btn danger" type="button" (click)="remove(b)">
              {{ i18n.t('common.delete') }}
            </button>
          </div>
        </li>
      }
    </ul>

    <section class="card data-box">
      <h2>💾 {{ i18n.t('brew.data') }}</h2>
      <p class="small muted">{{ i18n.t('brew.dataNote') }}</p>
      <div class="form-actions">
        <button class="btn" type="button" (click)="exportJson()">⬇ JSON</button>
        <button
          class="btn ghost"
          type="button"
          (click)="exportCsv()"
          [disabled]="!journal.brews().length"
        >
          ⬇ CSV
        </button>
        <label class="btn ghost file-btn"
          >⬆ {{ i18n.t('saved.import') }}
          <input type="file" accept="application/json,.json" (change)="importFile($event)" hidden
        /></label>
        <button class="btn ghost danger" type="button" (click)="clear()">
          {{ i18n.t('saved.reset') }}
        </button>
      </div>
      @if (message(); as m) {
        <p class="small">{{ m }}</p>
      }
    </section>
  `,
})
export class BrewLogPage {
  protected readonly i18n = inject(I18n);
  protected readonly content = inject(ContentService);
  protected readonly journal = inject(JournalService);

  protected readonly methods = BREW_METHODS;
  protected readonly method = signal<BrewMethod | ''>('');
  protected readonly bean = signal('');
  protected readonly minRating = signal(0);
  protected readonly message = signal('');
  private readonly lastExport = signal(Number(localStorage.getItem(LAST_EXPORT_KEY) ?? 0));

  protected readonly filtered = computed(() =>
    this.journal
      .brews()
      .filter(
        (b) =>
          (!this.method() || b.method === this.method()) &&
          (!this.bean() || b.beanId === this.bean()) &&
          b.rating >= this.minRating(),
      ),
  );
  protected readonly byMethod = computed(() => statsByMethod(this.journal.brews()));
  protected readonly maxCount = computed(() => Math.max(1, ...this.byMethod().map((s) => s.count)));
  protected readonly avgRating = computed(() => {
    const b = this.journal.brews();
    return b.length ? Math.round((b.reduce((n, x) => n + x.rating, 0) / b.length) * 10) / 10 : 0;
  });
  protected readonly flavors = computed(() =>
    topFlavors(this.journal.brews()).map((f) => {
      const hit = FLAVOR_BY_ID.get(f.id);
      return { ...f, name: hit ? this.i18n.pick(hit.note.name) : f.id, color: hit?.family.color };
    }),
  );
  protected readonly needsBackup = computed(
    () => this.journal.brews().length - this.lastExport() >= BACKUP_EVERY,
  );

  protected methodName(m: BrewMethod) {
    return this.i18n.pick(this.content.presetById().get(m)?.name) || m;
  }
  protected methodIcon(m: BrewMethod) {
    return this.content.presetById().get(m)?.icon ?? '☕';
  }
  protected flavorName(id: string) {
    const f = FLAVOR_BY_ID.get(id);
    return f ? this.i18n.pick(f.note.name) : id;
  }
  protected flavorColor(id: string) {
    return FLAVOR_BY_ID.get(id)?.family.color ?? null;
  }
  protected ratio(b: BrewLog) {
    return ratioOf(b.coffeeG, b.waterG);
  }
  protected clock(s: number) {
    return formatClock(s);
  }
  protected stars(n: number) {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
  protected when(iso: string) {
    const d = new Date(iso);
    return `${this.i18n.date(iso)} · ${d.toLocaleTimeString(this.i18n.lang() === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }

  protected remove(b: BrewLog) {
    if (confirm(this.i18n.t('brew.deleteConfirm'))) this.journal.deleteBrew(b.id);
  }

  private markExported() {
    const n = this.journal.brews().length;
    localStorage.setItem(LAST_EXPORT_KEY, String(n));
    this.lastExport.set(n);
  }

  protected exportJson() {
    const day = new Date().toISOString().slice(0, 10);
    download(
      `bo-coffee-journal-${day}.json`,
      JSON.stringify(this.journal.exportBackup(), null, 2),
      'application/json',
    );
    this.markExported();
  }

  protected exportCsv() {
    const day = new Date().toISOString().slice(0, 10);
    download(
      `bo-coffee-brews-${day}.csv`,
      brewsToCsv(this.journal.brews(), this.journal.beans()),
      'text/csv',
    );
  }

  protected async importFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const r = await this.journal.importBackup(await file.text());
      this.message.set(`✓ ${this.i18n.t('saved.imported')} ${r.beans} 🫘 · ${r.brews} ☕`);
    } catch (err) {
      this.message.set(`✗ ${this.i18n.t('saved.importFailed')} (${(err as Error).message})`);
    }
  }

  protected clear() {
    if (confirm(this.i18n.t('brew.clearConfirm'))) {
      this.journal.clearAll();
      this.markExported();
    }
  }
}
