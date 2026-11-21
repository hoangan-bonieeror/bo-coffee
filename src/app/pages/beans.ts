import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n } from '../core/i18n';
import {
  Bean,
  Process,
  RoastLevel,
  Species,
  daysSinceRoast,
  gramsLeft,
  newId,
} from '../core/journal';
import { JournalService } from '../core/journal.service';

interface BeanDraft {
  id?: string;
  name: string;
  roaster: string;
  origin: string;
  species: Species | '';
  process: Process | '';
  roastLevel: RoastLevel | '';
  roastDate: string;
  bagGrams: number | null;
  notes: string;
}

const EMPTY: BeanDraft = {
  name: '',
  roaster: '',
  origin: '',
  species: '',
  process: '',
  roastLevel: '',
  roastDate: '',
  bagGrams: 250,
  notes: '',
};

@Component({
  selector: 'app-beans',
  imports: [RouterLink],
  template: `
    <header class="page-head">
      <h1>🫘 {{ i18n.t('beans.title') }}</h1>
      <p class="muted">{{ i18n.t('beans.subtitle') }}</p>
      <div class="page-actions">
        @if (!draft()) {
          <button class="btn" type="button" (click)="edit()">+ {{ i18n.t('beans.add') }}</button>
        }
        <a class="btn ghost" routerLink="/brew">📒 {{ i18n.t('nav.journal') }}</a>
      </div>
    </header>

    @if (draft(); as d) {
      <form class="card bean-form" (submit)="save($event)">
        <h2>{{ d.id ? i18n.t('beans.edit') : i18n.t('beans.add') }}</h2>
        <div class="form-grid">
          <label class="wide"
            >{{ i18n.t('beans.name') }} *
            <input
              required
              maxlength="80"
              [value]="d.name"
              (input)="patch({ name: $any($event.target).value })"
              [placeholder]="i18n.t('beans.namePh')"
          /></label>
          <label
            >{{ i18n.t('beans.roaster') }}
            <input
              maxlength="60"
              [value]="d.roaster"
              (input)="patch({ roaster: $any($event.target).value })"
          /></label>
          <label
            >{{ i18n.t('beans.origin') }}
            <input
              maxlength="2"
              [value]="d.origin"
              (input)="patch({ origin: $any($event.target).value.toUpperCase() })"
              placeholder="VN, ET, CO…"
          /></label>
          <label
            >{{ i18n.t('beans.species') }}
            <select (change)="patch({ species: $any($event.target).value })">
              <option value="" [selected]="!d.species">—</option>
              @for (s of species; track s) {
                <option [value]="s" [selected]="d.species === s">{{ label('species', s) }}</option>
              }
            </select></label
          >
          <label
            >{{ i18n.t('beans.process') }}
            <select (change)="patch({ process: $any($event.target).value })">
              <option value="" [selected]="!d.process">—</option>
              @for (s of processes; track s) {
                <option [value]="s" [selected]="d.process === s">{{ label('process', s) }}</option>
              }
            </select></label
          >
          <label
            >{{ i18n.t('beans.roast') }}
            <select (change)="patch({ roastLevel: $any($event.target).value })">
              <option value="" [selected]="!d.roastLevel">—</option>
              @for (s of roasts; track s) {
                <option [value]="s" [selected]="d.roastLevel === s">{{ label('roast', s) }}</option>
              }
            </select></label
          >
          <label
            >{{ i18n.t('beans.roastDate') }}
            <input
              type="date"
              [value]="d.roastDate"
              (input)="patch({ roastDate: $any($event.target).value })"
          /></label>
          <label
            >{{ i18n.t('beans.bag') }} (g)
            <input
              type="number"
              min="0"
              max="10000"
              [value]="d.bagGrams ?? ''"
              (input)="patch({ bagGrams: $any($event.target).valueAsNumber || null })"
          /></label>
          <label class="wide"
            >{{ i18n.t('beans.notes') }}
            <input
              maxlength="160"
              [value]="d.notes"
              (input)="patch({ notes: $any($event.target).value })"
              [placeholder]="i18n.t('beans.notesPh')"
          /></label>
        </div>
        <div class="form-actions">
          <button class="btn" type="submit" [disabled]="!d.name.trim()">
            {{ i18n.t('common.save') }}
          </button>
          <button class="btn ghost" type="button" (click)="draft.set(null)">
            {{ i18n.t('common.cancel') }}
          </button>
        </div>
      </form>
    }

    @if (journal.ready() && !journal.beans().length && !draft()) {
      <div class="card empty-state">
        <p>{{ i18n.t('beans.empty') }}</p>
        <button class="btn" type="button" (click)="edit()">+ {{ i18n.t('beans.add') }}</button>
      </div>
    }

    <div class="bean-grid">
      @for (b of rows(); track b.bean.id) {
        <article class="card bean-card" [class.archived]="b.bean.archived">
          <header>
            <strong class="bean-name">{{ b.bean.name }}</strong>
            @if (b.bean.roaster) {
              <span class="small muted">{{ b.bean.roaster }}</span>
            }
          </header>
          <div class="bean-tags">
            @if (b.bean.origin) {
              <span class="chip static">{{ flag(b.bean.origin) }} {{ b.bean.origin }}</span>
            }
            @if (b.bean.species) {
              <span class="chip static">{{ label('species', b.bean.species) }}</span>
            }
            @if (b.bean.process) {
              <span class="chip static">{{ label('process', b.bean.process) }}</span>
            }
            @if (b.bean.roastLevel) {
              <span class="chip static roast-{{ b.bean.roastLevel }}">{{
                label('roast', b.bean.roastLevel)
              }}</span>
            }
          </div>
          @if (b.days !== null) {
            <p class="small">
              {{ i18n.t('beans.day') }} <strong>{{ b.days }}</strong>
              {{ i18n.t('beans.afterRoast') }}
              @if (b.days < 4) {
                · <span class="muted">{{ i18n.t('beans.resting') }}</span>
              }
            </p>
          }
          @if (b.left !== null) {
            <div class="bag-meter" [attr.aria-label]="i18n.t('beans.left')">
              <span [style.width.%]="b.pct"></span>
            </div>
            <p class="small muted">
              {{ b.left }} g {{ i18n.t('beans.left') }} · {{ b.brews }} {{ i18n.t('beans.brews') }}
            </p>
          }
          @if (b.bean.notes?.length) {
            <p class="small">{{ b.bean.notes!.join(', ') }}</p>
          }
          <footer class="bean-actions">
            <a class="btn small-btn" routerLink="/brew/new" [queryParams]="{ bean: b.bean.id }"
              >☕ {{ i18n.t('beans.brewThis') }}</a
            >
            <button class="btn ghost small-btn" type="button" (click)="edit(b.bean)">
              {{ i18n.t('common.edit') }}
            </button>
            <button class="btn ghost small-btn" type="button" (click)="toggleArchive(b.bean)">
              {{ b.bean.archived ? i18n.t('beans.unarchive') : i18n.t('beans.archive') }}
            </button>
            <button class="btn ghost small-btn danger" type="button" (click)="remove(b.bean)">
              {{ i18n.t('common.delete') }}
            </button>
          </footer>
        </article>
      }
    </div>
  `,
})
export class BeansPage {
  protected readonly i18n = inject(I18n);
  protected readonly journal = inject(JournalService);
  protected readonly draft = signal<BeanDraft | null>(null);

  protected readonly species: Species[] = ['arabica', 'robusta', 'liberica', 'blend'];
  protected readonly processes: Process[] = ['washed', 'natural', 'honey', 'anaerobic', 'other'];
  protected readonly roasts: RoastLevel[] = ['light', 'medium', 'dark'];

  protected readonly rows = computed(() => {
    const brews = this.journal.brews();
    return this.journal.beans().map((bean) => {
      const left = gramsLeft(bean, brews);
      return {
        bean,
        days: daysSinceRoast(bean.roastDate),
        left,
        pct: left !== null && bean.bagGrams ? (left / bean.bagGrams) * 100 : 0,
        brews: brews.filter((x) => x.beanId === bean.id).length,
      };
    });
  });

  protected label(kind: 'species' | 'process' | 'roast', v: string): string {
    return this.i18n.t(`${kind}.${v}` as Parameters<I18n['t']>[0]);
  }

  /** "VN" → 🇻🇳 */
  protected flag(code: string): string {
    return /^[A-Z]{2}$/.test(code)
      ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
      : '';
  }

  protected edit(b?: Bean) {
    this.draft.set(
      b
        ? {
            id: b.id,
            name: b.name,
            roaster: b.roaster ?? '',
            origin: b.origin ?? '',
            species: b.species ?? '',
            process: b.process ?? '',
            roastLevel: b.roastLevel ?? '',
            roastDate: b.roastDate ?? '',
            bagGrams: b.bagGrams ?? null,
            notes: (b.notes ?? []).join(', '),
          }
        : { ...EMPTY },
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected patch(p: Partial<BeanDraft>) {
    const d = this.draft();
    if (d) this.draft.set({ ...d, ...p });
  }

  protected async save(e: Event) {
    e.preventDefault();
    const d = this.draft();
    if (!d || !d.name.trim()) return;
    const prev = d.id ? this.journal.beanById().get(d.id) : undefined;
    await this.journal.saveBean({
      id: d.id ?? newId(),
      name: d.name.trim(),
      roaster: d.roaster.trim() || undefined,
      origin: /^[A-Z]{2}$/.test(d.origin) ? d.origin : undefined,
      species: d.species || undefined,
      process: d.process || undefined,
      roastLevel: d.roastLevel || undefined,
      roastDate: d.roastDate || undefined,
      bagGrams: d.bagGrams && d.bagGrams > 0 ? d.bagGrams : undefined,
      notes: d.notes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      archived: prev?.archived ?? false,
      created: prev?.created ?? new Date().toISOString(),
    });
    this.draft.set(null);
  }

  protected toggleArchive(b: Bean) {
    this.journal.saveBean({ ...b, archived: !b.archived });
  }

  protected remove(b: Bean) {
    if (confirm(this.i18n.t('beans.deleteConfirm'))) this.journal.deleteBean(b.id);
  }
}
