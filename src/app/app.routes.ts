import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then((m) => m.HomePage) },
  { path: 'p/:id', loadComponent: () => import('./pages/post').then((m) => m.PostPage) },
  { path: 'c/:id', loadComponent: () => import('./pages/category').then((m) => m.CategoryPage) },
  { path: 'tag/:tag', loadComponent: () => import('./pages/tag').then((m) => m.TagPage) },
  { path: 'series', loadComponent: () => import('./pages/series').then((m) => m.SeriesPage) },
  { path: 'series/:id', loadComponent: () => import('./pages/series').then((m) => m.SeriesPage) },
  { path: 'archive', loadComponent: () => import('./pages/archive').then((m) => m.ArchivePage) },
  { path: 'search', loadComponent: () => import('./pages/search').then((m) => m.SearchPage) },
  { path: 'saved', loadComponent: () => import('./pages/saved').then((m) => m.SavedPage) },
  { path: 'tools', loadComponent: () => import('./pages/tools').then((m) => m.ToolsPage) },
  { path: 'beans', loadComponent: () => import('./pages/beans').then((m) => m.BeansPage) },
  { path: 'brew', loadComponent: () => import('./pages/brew-log').then((m) => m.BrewLogPage) },
  {
    path: 'brew/new',
    loadComponent: () => import('./pages/brew-form').then((m) => m.BrewFormPage),
  },
  {
    path: 'brew/:id',
    loadComponent: () => import('./pages/brew-form').then((m) => m.BrewFormPage),
  },
  {
    path: 'glossary',
    loadComponent: () => import('./pages/glossary').then((m) => m.GlossaryPage),
  },
  { path: '**', redirectTo: '' },
];
