import { Component, HostListener, afterNextRender, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ContentService } from './core/content.service';
import { I18n } from './core/i18n';
import { BOT_CATEGORIES, NEWS_CATEGORY } from './core/models';
import { StoreService } from './core/store.service';
import { SteamBackground } from './shared/steam-bg';
import { MotionService } from './core/motion';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SteamBackground],
  template: `
    <app-steam-bg />
    <header class="navbar" [class.open]="menuOpen()">
      <div class="navbar-inner">
        <a class="brand" routerLink="/">
          <span class="brand-text">
            <strong>{{ i18n.t('app.name') }}</strong>
            <small>{{ i18n.t('app.tagline') }}</small>
          </span>
        </a>

        <nav class="nav-links" [attr.aria-label]="i18n.t('nav.menu')">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{
            i18n.t('nav.home')
          }}</a>
          <a routerLink="/archive" routerLinkActive="active">{{ i18n.t('nav.posts') }}</a>

          <div class="nav-drop" [class.open]="catsOpen()">
            <button
              type="button"
              class="nav-drop-btn"
              (click)="toggleCats($event)"
              [attr.aria-expanded]="catsOpen()"
            >
              {{ i18n.t('nav.categories') }} <span aria-hidden="true">▾</span>
            </button>
            <div class="nav-drop-menu">
              @for (c of topics(); track c.id) {
                <a [routerLink]="['/c', c.id]" routerLinkActive="active">
                  {{ i18n.pick(c.title) }}
                </a>
              }
              <a [routerLink]="['/c', newsId]" routerLinkActive="active">
                {{ i18n.t('nav.news') }}
              </a>
            </div>
          </div>

          <a routerLink="/series" routerLinkActive="active">{{ i18n.t('nav.series') }}</a>
          <a routerLink="/tools" routerLinkActive="active">{{ i18n.t('nav.tools') }}</a>
          <a routerLink="/brew" routerLinkActive="active">{{ i18n.t('nav.journal') }}</a>
          <a routerLink="/beans" routerLinkActive="active">{{ i18n.t('nav.beans') }}</a>
          <a routerLink="/glossary" routerLinkActive="active">{{ i18n.t('nav.glossary') }}</a>
          <a class="nav-mobile-only" routerLink="/search" routerLinkActive="active">{{
            i18n.t('nav.search')
          }}</a>
          <a class="nav-mobile-only" routerLink="/saved" routerLinkActive="active"
            >{{ i18n.t('nav.saved') }}
            @if (store.bookmarkCount()) {
              ({{ store.bookmarkCount() }})
            }
          </a>
        </nav>

        <div class="nav-actions">
          <a
            class="icon-btn search-btn"
            routerLink="/search"
            [title]="i18n.t('nav.search')"
            [attr.aria-label]="i18n.t('nav.search')"
            ><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle
                cx="10.5"
                cy="10.5"
                r="6.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="M15.5 15.5 21 21"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              /></svg
          ></a>
          <a
            class="icon-btn saved-btn"
            routerLink="/saved"
            [title]="i18n.t('nav.saved')"
            [attr.aria-label]="i18n.t('nav.saved')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M6 3h12v18l-6-4-6 4z"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />
            </svg>
            @if (store.bookmarkCount()) {
              <span class="count-dot">{{ store.bookmarkCount() }}</span>
            }
          </a>
          <div class="lang-switch" role="group" aria-label="Language">
            <button
              [class.on]="i18n.lang() === 'vi'"
              (click)="store.updateSettings({ lang: 'vi' })"
            >
              VI
            </button>
            <button
              [class.on]="i18n.lang() === 'en'"
              (click)="store.updateSettings({ lang: 'en' })"
            >
              EN
            </button>
          </div>
          <button
            class="icon-btn"
            (click)="store.toggleTheme()"
            [attr.aria-label]="i18n.t('nav.toggleTheme')"
            [title]="i18n.t('nav.toggleTheme')"
          >
            @if (store.settings().theme === 'dark') {
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="4.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                />
              </svg>
            }
          </button>
          <button
            class="icon-btn menu-btn"
            (click)="menuOpen.set(!menuOpen())"
            [attr.aria-expanded]="menuOpen()"
            [attr.aria-label]="i18n.t('nav.menu')"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              @if (menuOpen()) {
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
              } @else {
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
              }
            </svg>
          </button>
        </div>
      </div>
      <div class="tile-strip" aria-hidden="true"></div>
    </header>

    <main class="content">
      <router-outlet />
    </main>

    <footer class="site-footer">
      <div class="tile-strip" aria-hidden="true"></div>
      <div><strong>BO COFFEE</strong> — {{ i18n.t('footer.about') }}</div>
      <div class="footer-links">
        <a routerLink="/beans">{{ i18n.t('nav.beans') }}</a>
        <a routerLink="/glossary">{{ i18n.t('nav.glossary') }}</a>
        <a routerLink="/archive">{{ i18n.t('nav.archive') }}</a>
        <a [href]="'feed.' + i18n.lang() + '.xml'">{{ i18n.t('footer.rss') }}</a>
        <a href="https://github.com/hoangan-bonieeror/bo-coffee" target="_blank" rel="noopener"
          >GitHub</a
        >
      </div>
    </footer>

    <nav class="tabbar" [attr.aria-label]="i18n.t('nav.menu')">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{
        i18n.t('nav.home')
      }}</a>
      <a routerLink="/archive" routerLinkActive="active">{{ i18n.t('nav.posts') }}</a>
      <a routerLink="/tools" routerLinkActive="active">{{ i18n.t('nav.tools') }}</a>
      <a routerLink="/brew" routerLinkActive="active">{{ i18n.t('nav.journal') }}</a>
    </nav>
  `,
})
export class App {
  protected readonly i18n = inject(I18n);
  protected readonly store = inject(StoreService);
  private readonly content = inject(ContentService);
  protected readonly menuOpen = signal(false);
  protected readonly catsOpen = signal(false);
  protected readonly newsId = NEWS_CATEGORY;
  protected readonly topics = () =>
    this.content.categories().filter((c) => !BOT_CATEGORIES.includes(c.id));

  constructor() {
    const motion = inject(MotionService);
    afterNextRender(() => motion.start());
    inject(Router).events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.menuOpen.set(false);
        this.catsOpen.set(false);
      }
    });
  }

  protected toggleCats(e: Event) {
    e.stopPropagation();
    this.catsOpen.set(!this.catsOpen());
  }

  @HostListener('document:click')
  protected closeMenus() {
    this.catsOpen.set(false);
  }
}
