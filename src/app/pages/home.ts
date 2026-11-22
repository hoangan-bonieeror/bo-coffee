import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { beverageEstimate, extractionYield, formatClock } from '../core/brew';
import { ContentService } from '../core/content.service';
import { I18n } from '../core/i18n';
import { JournalService } from '../core/journal.service';
import { BOT_CATEGORIES, NEWS_CATEGORY } from '../core/models';
import { PostCard } from '../shared/post-card';

const PAGE = 6;

/** Chart frame (SVG user units). */
const X0 = 50;
const X1 = 560;
const Y0 = 290;
const Y1 = 20;
/** Extraction yield axis, % — the ideal band (SCA) is 18–22. */
const EY_MIN = 14;
const EY_MAX = 26;
const EY_ZONE: [number, number] = [18, 22];
/** Gold Cup strength band, only meaningful for filter-strength methods. */
const TDS_ZONE: [number, number] = [1.15, 1.35];
const FILTER_METHODS = ['v60', 'french-press', 'aeropress'];

interface CupPoint {
  x: number;
  y: number;
  ey: number;
  tds: number;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, PostCard],
  template: `
    @if (content.error()) {
      <p class="error">{{ i18n.t('common.error') }}</p>
    }

    <section class="menu-hero">
      <div class="menu-board">
        <h1>{{ i18n.t('home.menuTitle') }}</h1>
        <p class="menu-note">{{ i18n.t('home.menuNote') }}</p>
        <ul class="menu-list">
          @for (m of menu(); track m.id) {
            <li>
              <a routerLink="/tools" [queryParams]="{ method: m.id }">
                <span class="menu-name"
                  >{{ m.name }}<span class="menu-dots" aria-hidden="true"></span
                ></span>
                <span class="menu-price">{{ m.ratio }}</span>
                <span class="menu-meta">{{ m.meta }}</span>
              </a>
            </li>
          }
        </ul>
      </div>

      <figure class="lab-panel cup-panel">
        <figcaption class="lab-caption">
          <span>{{ i18n.t('home.lastCup') }}{{ cup()?.label ? ' · ' + cup()!.label : '' }}</span>
          @if (cup(); as c) {
            <span class="cup-status cup-{{ c.status }}">● {{ c.statusText }}</span>
          }
        </figcaption>
        @if (cup(); as c) {
          <svg viewBox="0 0 590 330" class="cup-chart" role="img" [attr.aria-label]="c.alt">
            <g class="cup-grid">
              @for (t of xTicks; track t.v) {
                <line [attr.x1]="t.x" [attr.y1]="Y1" [attr.x2]="t.x" [attr.y2]="Y0"></line>
              }
              @for (t of c.yTicks; track t.v) {
                <line [attr.x1]="X0" [attr.y1]="t.y" [attr.x2]="X1" [attr.y2]="t.y"></line>
              }
            </g>
            <rect
              class="cup-zone"
              [attr.x]="c.zone.x"
              [attr.y]="c.zone.y"
              [attr.width]="c.zone.w"
              [attr.height]="c.zone.h"
            ></rect>
            <text class="cup-zone-label" [attr.x]="c.zone.x + 6" [attr.y]="c.zone.y + 16">
              {{ c.zone.label }}
            </text>
            @for (p of c.older; track $index) {
              <circle class="cup-old" [attr.cx]="p.x" [attr.cy]="p.y" r="6"></circle>
            }
            <circle
              class="cup-ring cup-dot-{{ c.status }}"
              [attr.cx]="c.last.x"
              [attr.cy]="c.last.y"
              r="20"
            ></circle>
            <circle
              class="cup-last cup-dot-{{ c.status }}"
              [attr.cx]="c.last.x"
              [attr.cy]="c.last.y"
              r="8"
            ></circle>
            <g class="cup-axis">
              @for (t of xTicks; track t.v) {
                <text [attr.x]="t.x - 7" y="310">{{ t.v }}</text>
              }
              @for (t of c.yTicks; track t.v) {
                <text x="4" [attr.y]="t.y + 4">{{ t.label }}</text>
              }
              <text x="430" y="328">{{ i18n.t('home.eyAxis').toUpperCase() }}</text>
              <text x="54" y="13">TDS %</text>
            </g>
          </svg>
          <div class="cup-stats">
            <div>
              <p>{{ i18n.t('home.ey') }}</p>
              <p class="cup-{{ c.status }}">{{ c.last.ey }}%</p>
            </div>
            <div>
              <p>TDS</p>
              <p>{{ c.last.tds }}%</p>
            </div>
            <div>
              <p>{{ i18n.t('home.rating') }}</p>
              <p class="num-accent">★ {{ c.rating }}</p>
            </div>
          </div>
        } @else {
          <p class="cup-empty">{{ i18n.t('home.cupEmpty') }}</p>
          <a class="btn" routerLink="/brew/new">+ {{ i18n.t('home.cupLog') }}</a>
        }
      </figure>
    </section>

    <section class="home-posts" aria-labelledby="home-posts-title">
      <div class="section-row">
        <h2 id="home-posts-title" class="section-title">{{ i18n.t('home.latest') }}</h2>
        <a routerLink="/archive">{{ i18n.t('home.allPosts') }} ({{ feed().length }})</a>
      </div>
      <div class="lab-grid">
        @for (p of latest(); track p.id; let first = $first) {
          <app-post-card [post]="p" variant="lab" [highlight]="first" />
        }
      </div>
      @if (hasMore()) {
        <div class="center load-more">
          <button class="btn ghost" (click)="shown.set(shown() + PAGE)">
            {{ i18n.t('home.loadMore') }}
          </button>
        </div>
      }
    </section>

    <nav class="tool-row" [attr.aria-label]="i18n.t('home.tools')">
      <span class="tool-row-label">{{ i18n.t('home.tools') }}</span>
      @for (t of toolLinks; track t.key; let i = $index) {
        <a class="tool-btn" routerLink="/tools" [fragment]="t.fragment"
          ><span>{{ '0' + (i + 1) }}</span
          >{{ i18n.t(t.key) }}</a
        >
      }
    </nav>

    <div class="home-extras">
      @if (news(); as n) {
        <section class="lab-panel">
          <h2 class="lab-caption">{{ i18n.t('home.news') }}</h2>
          <a class="news-mini" [routerLink]="['/p', n.id]">
            <span class="muted small">{{ i18n.date(n.date, 'long') }}</span>
            <strong>{{ i18n.pick(n.title) }}</strong>
            <span class="news-mini-sum">{{ i18n.pick(n.summary) }}</span>
          </a>
          <a class="small" [routerLink]="['/c', newsId]">{{ i18n.t('home.allNews') }} →</a>
        </section>
      }

      <section class="lab-panel">
        <h2 class="lab-caption">{{ i18n.t('home.categories') }}</h2>
        <ul class="chip-list">
          @for (c of cats(); track c.id) {
            <li>
              <a class="chip" [routerLink]="['/c', c.id]"
                >{{ i18n.pick(c.title) }} <span>{{ c.count }}</span></a
              >
            </li>
          }
        </ul>
      </section>

      @if (seriesList().length) {
        <section class="lab-panel">
          <h2 class="lab-caption">{{ i18n.t('home.series') }}</h2>
          <ul class="side-series">
            @for (s of seriesList(); track s.id) {
              <li>
                <a [routerLink]="['/series', s.id]">{{ i18n.pick(s.title) }}</a>
                <span class="muted small">{{ s.count }} {{ i18n.t('series.parts') }}</span>
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
})
export class HomePage {
  protected readonly i18n = inject(I18n);
  protected readonly content = inject(ContentService);
  private readonly journal = inject(JournalService);
  protected readonly PAGE = PAGE;
  protected readonly shown = signal(PAGE);
  protected readonly X0 = X0;
  protected readonly X1 = X1;
  protected readonly Y0 = Y0;
  protected readonly Y1 = Y1;
  protected readonly newsId = NEWS_CATEGORY;

  protected readonly toolLinks = [
    { key: 'home.toolRatio', fragment: 'ratio' },
    { key: 'home.toolTimer', fragment: 'timer' },
    { key: 'home.toolEy', fragment: 'ey' },
    { key: 'home.toolWheel', fragment: 'wheel' },
  ] as const;

  protected readonly xTicks = [14, 16, 18, 20, 22, 24, 26].map((v) => ({ v, x: this.ex(v) }));

  /** Bot posts live in their own box; the feed shows articles, guides and notes. */
  protected readonly feed = computed(() =>
    this.content.posts().filter((p) => !BOT_CATEGORIES.includes(p.category)),
  );
  protected readonly latest = computed(() => this.feed().slice(0, this.shown()));
  protected readonly hasMore = computed(() => this.feed().length > this.shown());
  protected readonly news = computed(() =>
    this.content.posts().find((p) => p.category === NEWS_CATEGORY),
  );

  /** One line per brew method, priced by its ratio. */
  protected readonly menu = computed(() =>
    this.content.presets().map((p) => {
      const grind = this.i18n.pick(p.grind).split(/[,(]/)[0].trim();
      return {
        id: p.id,
        name: this.i18n.pick(p.name),
        ratio: `1:${p.ratio}`,
        meta: [grind, `${p.tempC[0]}–${p.tempC[1]}°C`, formatClock(p.timeSec)]
          .join(' · ')
          .toUpperCase(),
      };
    }),
  );

  /** The latest brews that have a TDS reading, plotted on extraction vs strength. */
  protected readonly cup = computed(() => {
    const measured = this.journal
      .brews()
      .filter((b) => (b.tds ?? 0) > 0)
      .slice(0, 6)
      .map((b) => ({
        brew: b,
        tds: b.tds!,
        ey: extractionYield(b.tds!, beverageEstimate(b.waterG, b.coffeeG), b.coffeeG),
      }))
      .filter((m) => m.ey > 0);
    if (!measured.length) return null;

    const latest = measured[0];
    const filter = FILTER_METHODS.includes(latest.brew.method);
    const sameScale = measured.filter((m) => FILTER_METHODS.includes(m.brew.method) === filter);
    const tdsValues = sameScale.map((m) => m.tds);
    let lo = Math.min(...tdsValues);
    let hi = Math.max(...tdsValues);
    if (filter) {
      lo = Math.min(lo, TDS_ZONE[0] - 0.1);
      hi = Math.max(hi, TDS_ZONE[1] + 0.05);
    }
    const pad = Math.max((hi - lo) * 0.15, 0.05);
    lo = Math.max(0, lo - pad);
    hi = hi + pad;
    const ty = (v: number) => Y0 - ((v - lo) / (hi - lo)) * (Y0 - Y1);
    const point = (m: (typeof measured)[number]): CupPoint => ({
      x: this.ex(Math.min(EY_MAX, Math.max(EY_MIN, m.ey))),
      y: ty(m.tds),
      ey: m.ey,
      tds: m.tds,
    });

    const zoneTop = filter ? ty(TDS_ZONE[1]) : Y1;
    const zoneBottom = filter ? ty(TDS_ZONE[0]) : Y0;
    const status = latest.ey < EY_ZONE[0] ? 'under' : latest.ey > EY_ZONE[1] ? 'over' : 'balanced';
    const statusText = this.i18n.t(
      status === 'under' ? 'home.under' : status === 'over' ? 'home.over' : 'home.balanced',
    );
    const preset = this.content.presetById().get(latest.brew.method);
    const label = this.i18n.pick(preset?.name) || latest.brew.method;
    const step = (hi - lo) / 3;
    return {
      label: label.toUpperCase(),
      status,
      statusText: statusText.toUpperCase(),
      rating: latest.brew.rating,
      last: point(latest),
      older: sameScale.filter((m) => m !== latest).map(point),
      yTicks: [0, 1, 2, 3].map((i) => {
        const v = lo + step * i;
        return { v, y: ty(v), label: v.toFixed(v >= 10 ? 0 : 2) };
      }),
      zone: {
        x: this.ex(EY_ZONE[0]),
        y: zoneTop,
        w: this.ex(EY_ZONE[1]) - this.ex(EY_ZONE[0]),
        h: zoneBottom - zoneTop,
        label: filter ? 'GOLD CUP' : this.i18n.t('home.idealZone').toUpperCase(),
      },
      alt: `${this.i18n.t('home.chartAlt')}: ${this.i18n.t('home.ey')} ${latest.ey}%, TDS ${latest.tds}%, ${statusText}`,
    };
  });

  protected readonly cats = computed(() =>
    this.content
      .categories()
      .map((c) => ({
        ...c,
        count: this.content.posts().filter((p) => p.category === c.id).length,
      }))
      .filter((c) => c.count > 0),
  );
  protected readonly seriesList = computed(() =>
    this.content
      .series()
      .map((s) => ({ ...s, count: this.content.posts().filter((p) => p.series === s.id).length }))
      .filter((s) => s.count > 0),
  );

  private ex(v: number) {
    return X0 + ((v - EY_MIN) / (EY_MAX - EY_MIN)) * (X1 - X0);
  }
}
