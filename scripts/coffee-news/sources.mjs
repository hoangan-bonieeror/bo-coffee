// Data sources for the weekly coffee-news bot: RSS/Atom feeds of coffee news sites.
// Every source is optional: a failing feed is reported, it never fails the whole run.
import { DOMParser } from 'linkedom';
import { cleanText } from '../lib/text.mjs';
import { FEEDS } from './config.mjs';

// "Mozilla/5.0 (compatible; …)" is the usual crawler form; some sites refuse bare bot names.
const UA =
  'Mozilla/5.0 (compatible; bo-coffee-news-bot/1.0; +https://github.com/hoangan-bonieeror/bo-coffee)';
const MAX_BYTES = 3_000_000;

async function fetchText(url, accept) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: accept },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.subarray(0, MAX_BYTES).toString('utf8');
}

const textOf = (el, ...tags) => {
  for (const t of tags) {
    const n = el.getElementsByTagName(t)[0];
    const v = n?.textContent?.trim();
    if (v) return v;
  }
  return '';
};

/** Atom <link rel="alternate" href> or RSS <link>text</link>. */
function linkOf(el) {
  const links = [...el.getElementsByTagName('link')];
  for (const l of links) {
    const href = l.getAttribute('href');
    const rel = l.getAttribute('rel');
    if (href && (!rel || rel === 'alternate')) return href.trim();
  }
  const t = links[0]?.textContent?.trim();
  return t || textOf(el, 'guid');
}

/** First image URL from media tags, enclosure, or the description HTML. */
function imageOf(el, html) {
  for (const tag of ['media:content', 'media:thumbnail', 'enclosure']) {
    for (const n of el.getElementsByTagName(tag)) {
      const url = n.getAttribute('url');
      const type = n.getAttribute('type') ?? '';
      if (url && (tag !== 'enclosure' || type.startsWith('image'))) return url;
    }
  }
  return html.match(/<img[^>]+src="([^"]+)"/i)?.[1] ?? '';
}

/** Parse an RSS 2.0 or Atom document into items. Exported for tests. */
export function parseFeed(xml, feed) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const entries = [...doc.getElementsByTagName('item'), ...doc.getElementsByTagName('entry')];
  return entries
    .map((el) => {
      const html = textOf(el, 'description', 'summary', 'content:encoded', 'content');
      const date = textOf(el, 'pubDate', 'published', 'updated', 'dc:date');
      const time = Date.parse(date);
      return {
        source: feed.id,
        sourceName: feed.name,
        weight: feed.weight ?? 1,
        lang: feed.lang ?? 'en',
        title: cleanText(textOf(el, 'title'), 200),
        url: linkOf(el),
        description: cleanText(html, 300),
        image: imageOf(el, html),
        time: Number.isNaN(time) ? null : time,
      };
    })
    .filter((it) => it.title && /^https?:\/\//.test(it.url));
}

export async function readFeed(feed, { hours }) {
  // A feed may list fallback URLs (sites move their RSS); the first one that answers wins.
  const urls = [feed.url, ...(feed.fallbackUrls ?? [])];
  let xml;
  let lastError;
  for (const url of urls) {
    try {
      xml = await fetchText(
        url,
        'application/rss+xml, application/atom+xml, application/xml, text/xml',
      );
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (xml === undefined) throw lastError;
  const since = Date.now() - hours * 3600e3;
  // Undated items are kept; the seen-list stops them from repeating on later days.
  return parseFeed(xml, feed).filter(
    (it) =>
      (!it.time || it.time >= since) &&
      (!feed.mustMatch || feed.mustMatch.test(`${it.title} ${it.description}`)),
  );
}

export const SOURCES = [
  ...FEEDS.map((f) => ({ id: f.id, name: f.name, run: (o) => readFeed(f, o) })),
];
