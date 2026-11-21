export type Lang = 'vi' | 'en';
export type Theme = 'light' | 'dark';

/** A piece of text available in both languages. */
export interface I18nText {
  vi: string;
  en: string;
}

export interface Category {
  id: string;
  icon: string;
  colors: [string, string];
  title: I18nText;
  desc: I18nText;
}

export interface Series {
  id: string;
  title: I18nText;
  desc: I18nText;
}

export type PostType = 'article' | 'note' | 'guide' | 'news';
export type Level = 'beginner' | 'intermediate' | 'advanced';

/** One entry of public/content/generated/posts.json (built by scripts/build-content.mjs). */
export interface PostMeta {
  id: string;
  date: string;
  category: string;
  type: PostType;
  tags: string[];
  series?: string;
  seriesOrder?: number;
  cover?: string;
  level?: Level;
  method?: string;
  origin?: string;
  author: string;
  langs: Lang[];
  title: I18nText;
  summary: I18nText;
  minutes: { vi: number; en: number };
}

export interface SiteInfo {
  title: string;
  url: string;
  author: string;
  description: I18nText;
}

export const NEWS_CATEGORY = 'coffee-news';
/** Categories filled by bots; kept out of the home feed and the topics menu. */
export const BOT_CATEGORIES = [NEWS_CATEGORY];

export interface Settings {
  lang: Lang;
  theme: Theme;
}

export interface PostNote {
  text: string;
  updated: string;
}

export interface AppState {
  version: 2;
  settings: Settings;
  /** postId -> ISO date first read to the end */
  read: Record<string, string>;
  /** postId -> ISO date bookmarked */
  bookmarks: Record<string, string>;
  /** postId -> personal note */
  notes: Record<string, PostNote>;
}
