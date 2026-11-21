import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService, GlossaryTerm } from '../core/content.service';
import { I18n } from '../core/i18n';

/** "Thiết kế" → "thiet ke": search ignores Vietnamese diacritics. */
const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

@Component({
  selector: 'app-glossary',
  imports: [RouterLink],
  template: `
    <header class="page-head">
      <h1>📖 {{ i18n.t('glossary.title') }}</h1>
      <p class="muted">{{ i18n.t('glossary.subtitle') }}</p>
      <input
        class="search-input"
        type="search"
        [placeholder]="i18n.t('glossary.search')"
        [value]="q()"
        (input)="q.set($any($event.target).value)"
      />
    </header>

    @if (failed()) {
      <p class="error">{{ i18n.t('common.error') }}</p>
    }

    @for (g of groups(); track g.letter) {
      <section class="glossary-group">
        <h2 class="glossary-letter">{{ g.letter }}</h2>
        <dl class="glossary-list">
          @for (t of g.terms; track t.id) {
            <div class="card glossary-item" [id]="'g-' + t.id">
              <dt>{{ i18n.pick(t.term) }}</dt>
              <dd>
                {{ i18n.pick(t.def) }}
                @if (t.post && content.postById().get(t.post); as p) {
                  <a [routerLink]="['/p', p.id]">→ {{ i18n.pick(p.title) }}</a>
                }
              </dd>
            </div>
          }
        </dl>
      </section>
    } @empty {
      @if (loaded()) {
        <p class="muted">{{ i18n.t('search.none') }}</p>
      }
    }
  `,
})
export class GlossaryPage {
  protected readonly i18n = inject(I18n);
  protected readonly content = inject(ContentService);
  protected readonly q = signal('');
  private readonly terms = signal<GlossaryTerm[]>([]);
  protected readonly loaded = signal(false);
  protected readonly failed = signal(false);

  protected readonly groups = computed(() => {
    const q = fold(this.q().trim());
    const lang = this.i18n.lang();
    const list = this.terms()
      .filter((t) => !q || fold(`${t.term.vi} ${t.term.en} ${t.def[lang]}`).includes(q))
      .sort((a, b) => fold(a.term[lang]).localeCompare(fold(b.term[lang])));
    const map = new Map<string, GlossaryTerm[]>();
    for (const t of list) {
      const letter = fold(t.term[lang]).charAt(0).toUpperCase() || '#';
      map.set(letter, [...(map.get(letter) ?? []), t]);
    }
    return [...map.entries()].map(([letter, terms]) => ({ letter, terms }));
  });

  constructor() {
    this.content
      .glossary()
      .then((t) => this.terms.set(t))
      .catch(() => this.failed.set(true))
      .finally(() => this.loaded.set(true));
  }
}
