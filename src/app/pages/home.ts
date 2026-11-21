import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../core/content.service';
import { I18n } from '../core/i18n';
import { daysSinceRoast } from '../core/journal';
import { JournalService } from '../core/journal.service';
import { BOT_CATEGORIES, NEWS_CATEGORY } from '../core/models';
import { PostCard } from '../shared/post-card';

const PAGE = 9;

@Component({
  selector: 'app-home',
  imports: [RouterLink, PostCard],
  template: `
    <section class="home-hero">
      <p class="hero-kicker">
        <span class="dot"></span>{{ content.posts().length }} {{ i18n.t('common.posts') }} ·
        {{ content.presets().length }} {{ i18n.t('home.methods') }}
      </p>
      <h1>{{ i18n.t('home.title') }}</h1>
      <p class="muted">{{ i18n.t('home.subtitle') }}</p>
      <div class="hero-actions">
        <a class="btn" [routerLink]="['/series', 'coffee-101']">📚 {{ i18n.t('home.start') }}</a>
        <a class="btn ghost" routerLink="/tools">⏱ {{ i18n.t('home.brewNow') }}</a>
        <a class="btn ghost" routerLink="/brew">📒 {{ i18n.t('nav.journal') }}</a>
      </div>
    </section>

    @if (content.error()) {
      <p class="error">{{ i18n.t('common.error') }}</p>
    }

    <section class="method-strip" [attr.aria-label]="i18n.t('home.methodsTitle')">
      @for (p of content.presets(); track p.id) {
        <a class="method-tile" routerLink="/tools" [queryParams]="{ method: p.id }">
          <span class="method-icon">{{ p.icon }}</span>
          <strong>{{ i18n.pick(p.name) }}</strong>
          <span class="small muted">1:{{ p.ratio }} · {{ p.tempC[0] }}–{{ p.tempC[1] }}°C</span>
        </a>
      }
    </section>

    <div class="home-layout">
      <div class="home-main">
        @if (featured(); as f) {
          <h2 class="section-title">{{ i18n.t('home.featured') }}</h2>
          <app-post-card [post]="f" variant="featured" />
        }

        <h2 class="section-title">{{ i18n.t('home.latest') }}</h2>
        <div class="post-grid">
          @for (p of latest(); track p.id) {
            <app-post-card [post]="p" />
          }
        </div>
        @if (hasMore()) {
          <div class="center load-more">
            <button class="btn ghost" (click)="shown.set(shown() + PAGE)">
              {{ i18n.t('home.loadMore') }}
            </button>
          </div>
        }
      </div>

      <aside class="home-side">
        <div class="side-block journal-mini">
          <h3 class="side-title">📒 {{ i18n.t('home.journal') }}</h3>
          @if (lastBrew(); as b) {
            <a class="news-mini" routerLink="/brew">
              <span class="muted small">{{ i18n.date(b.brew.brewedAt, 'long') }}</span>
              <strong>{{ b.method }} · {{ '★'.repeat(b.brew.rating) }}</strong>
              <span class="news-mini-sum"
                >{{ b.brew.coffeeG }} g / {{ b.brew.waterG }} g
                @if (b.bean) {
                  · {{ b.bean }}
                }
              </span>
            </a>
          } @else {
            <p class="small muted">{{ i18n.t('home.journalEmpty') }}</p>
          }
          @if (freshBean(); as fb) {
            <p class="small">
              🫘 {{ fb.name }} ·
              <span class="muted">{{ i18n.t('beans.day') }} {{ fb.days }}</span>
            </p>
          }
          <a class="small" routerLink="/brew/new">+ {{ i18n.t('brew.new') }}</a>
        </div>

        @if (news(); as n) {
          <div class="side-block">
            <h3 class="side-title">📰 {{ i18n.t('home.news') }}</h3>
            <a class="news-mini" [routerLink]="['/p', n.id]">
              <span class="muted small">{{ i18n.date(n.date, 'long') }}</span>
              <strong>{{ i18n.pick(n.title) }}</strong>
              <span class="news-mini-sum">{{ i18n.pick(n.summary) }}</span>
            </a>
            <a class="small" [routerLink]="['/c', newsId]">{{ i18n.t('home.allNews') }} →</a>
          </div>
        }

        <div class="side-block">
          <h3 class="side-title">{{ i18n.t('home.categories') }}</h3>
          <ul class="side-cats">
            @for (c of cats(); track c.id) {
              <li>
                <a [routerLink]="['/c', c.id]">
                  <span
                    class="side-cat-icon"
                    [style.--c1]="c.colors[0]"
                    [style.--c2]="c.colors[1]"
                    >{{ c.icon }}</span
                  >
                  <span>{{ i18n.pick(c.title) }}</span>
                  <span class="muted small">{{ c.count }}</span>
                </a>
              </li>
            }
          </ul>
        </div>

        @if (seriesList().length) {
          <div class="side-block">
            <h3 class="side-title">📚 {{ i18n.t('home.series') }}</h3>
            <ul class="side-series">
              @for (s of seriesList(); track s.id) {
                <li>
                  <a [routerLink]="['/series', s.id]">{{ i18n.pick(s.title) }}</a>
                  <span class="muted small">{{ s.count }} {{ i18n.t('series.parts') }}</span>
                </li>
              }
            </ul>
          </div>
        }

        <div class="side-block">
          <h3 class="side-title"># {{ i18n.t('home.tags') }}</h3>
          <div class="tag-cloud">
            @for (t of tags(); track t.tag) {
              <a class="tag-pill" [routerLink]="['/tag', t.tag]"
                >#{{ t.tag }} <span>{{ t.count }}</span></a
              >
            }
          </div>
        </div>
      </aside>
    </div>
  `,
})
export class HomePage {
  protected readonly i18n = inject(I18n);
  protected readonly content = inject(ContentService);
  private readonly journal = inject(JournalService);
  protected readonly PAGE = PAGE;
  protected readonly shown = signal(PAGE);

  /** Bot posts live in their own box; the feed shows articles, guides and notes. */
  private readonly feed = computed(() =>
    this.content.posts().filter((p) => !BOT_CATEGORIES.includes(p.category)),
  );
  protected readonly newsId = NEWS_CATEGORY;
  protected readonly news = computed(() =>
    this.content.posts().find((p) => p.category === NEWS_CATEGORY),
  );
  protected readonly featured = computed(() => this.feed().find((p) => p.type === 'article'));
  private readonly rest = computed(() => this.feed().filter((p) => p !== this.featured()));
  protected readonly latest = computed(() => this.rest().slice(0, this.shown()));
  protected readonly hasMore = computed(() => this.rest().length > this.shown());

  protected readonly lastBrew = computed(() => {
    const brew = this.journal.brews()[0];
    if (!brew) return null;
    return {
      brew,
      method: this.i18n.pick(this.content.presetById().get(brew.method)?.name) || brew.method,
      bean: brew.beanId ? this.journal.beanById().get(brew.beanId)?.name : undefined,
    };
  });
  protected readonly freshBean = computed(() => {
    const b = this.journal.activeBeans().find((x) => x.roastDate);
    const days = daysSinceRoast(b?.roastDate);
    return b && days !== null ? { name: b.name, days } : null;
  });

  protected readonly cats = computed(() =>
    this.content.categories().map((c) => ({
      ...c,
      count: this.content.posts().filter((p) => p.category === c.id).length,
    })),
  );
  protected readonly seriesList = computed(() =>
    this.content
      .series()
      .map((s) => ({ ...s, count: this.content.posts().filter((p) => p.series === s.id).length }))
      .filter((s) => s.count > 0),
  );
  protected readonly tags = computed(() => {
    const m = new Map<string, number>();
    for (const p of this.feed()) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 24)
      .map(([tag, count]) => ({ tag, count }));
  });
}
