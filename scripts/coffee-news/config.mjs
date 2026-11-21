// Configuration for the weekly coffee-news bot (scripts/coffee-news/index.mjs).
// Edit feeds, sections and limits here; no code changes needed.
//
// Feed URLs are standard WordPress/RSS endpoints for these sites. A feed that fails is skipped and
// listed at the end of the post, so check the "Unavailable" line after the first runs and fix or
// remove broken URLs.

/** How far back to look, in hours: a week plus a margin so nothing falls between runs. */
export const WINDOW_HOURS = 180;

export const LIMITS = {
  items: 12, // stories per post
  headlines: 3, // "top stories" with key points
  perSource: 3, // keep one site from dominating
  perSection: 4,
  minItems: 4, // fewer than this → no post this week
};

/**
 * RSS / Atom feeds. `weight` nudges ranking. `lang` is the feed's language (Gemini translates).
 * `mustMatch` keeps only items whose title/description matches (for general news feeds).
 */
export const FEEDS = [
  { id: 'sprudge', name: 'Sprudge', url: 'https://sprudge.com/feed', weight: 1.1 },
  {
    id: 'pdg',
    name: 'Perfect Daily Grind',
    url: 'https://perfectdailygrind.com/feed/',
    weight: 1.1,
  },
  {
    id: 'dcn',
    name: 'Daily Coffee News',
    url: 'https://dailycoffeenews.com/feed/',
    weight: 1.1,
  },
  {
    id: 'barista-mag',
    name: 'Barista Magazine',
    url: 'https://www.baristamagazine.com/feed/',
    weight: 1.0,
  },
  { id: 'gcr', name: 'Global Coffee Report', url: 'https://www.gcrmag.com/feed/', weight: 1.0 },
  {
    id: 'coffee-review',
    name: 'Coffee Review',
    url: 'https://www.coffeereview.com/feed/',
    weight: 0.9,
  },
  {
    id: 'vnexpress',
    name: 'VnExpress Kinh doanh',
    url: 'https://vnexpress.net/rss/kinh-doanh.rss',
    weight: 1.0,
    lang: 'vi',
    mustMatch: /cà phê|robusta|arabica/i,
  },
];

/** Each story goes to the first section whose keywords it matches (title + description). */
export const SECTIONS = [
  {
    id: 'vietnam',
    icon: '🇻🇳',
    title: { vi: 'Cà phê Việt Nam', en: 'Vietnamese coffee' },
    bonus: 0.6,
    keywords: [
      'vietnam',
      'vietnamese',
      'việt nam',
      'tây nguyên',
      'đắk lắk',
      'dak lak',
      'lâm đồng',
      'buôn ma thuột',
    ],
  },
  {
    id: 'market',
    icon: '📈',
    title: { vi: 'Thị trường & giá', en: 'Markets & prices' },
    bonus: 0.4,
    keywords: [
      'price',
      'prices',
      'futures',
      'export',
      'exports',
      'import',
      'tariff',
      'tariffs',
      'market',
      'giá',
      'xuất khẩu',
      'thuế',
      'harvest',
      'crop',
      'supply',
    ],
  },
  {
    id: 'farming',
    icon: '🌱',
    title: { vi: 'Trồng trọt & khí hậu', en: 'Farming & climate' },
    bonus: 0.4,
    keywords: [
      'farm',
      'farmer',
      'farmers',
      'producer',
      'producers',
      'climate',
      'drought',
      'rust',
      'variety',
      'varieties',
      'research',
      'processing',
      'fermentation',
      'nông dân',
      'khí hậu',
      'hạn hán',
    ],
  },
  {
    id: 'cafes',
    icon: '🏪',
    title: { vi: 'Quán & nhà rang', en: 'Cafés & roasters' },
    bonus: 0.2,
    keywords: [
      'cafe',
      'café',
      'cafes',
      'cafés',
      'roaster',
      'roasters',
      'roastery',
      'shop',
      'chain',
      'starbucks',
      'opening',
      'quán',
      'chuỗi',
    ],
  },
  {
    id: 'gear',
    icon: '⚙️',
    title: { vi: 'Thiết bị', en: 'Gear' },
    bonus: 0.2,
    keywords: [
      'grinder',
      'machine',
      'espresso machine',
      'brewer',
      'kettle',
      'scale',
      'dripper',
      'launch',
      'launches',
      'máy pha',
      'máy xay',
    ],
  },
  {
    id: 'events',
    icon: '🏆',
    title: { vi: 'Cuộc thi & sự kiện', en: 'Competitions & events' },
    bonus: 0.2,
    keywords: [
      'championship',
      'champion',
      'competition',
      'award',
      'awards',
      'expo',
      'festival',
      'world barista',
      'cup of excellence',
      'cuộc thi',
      'lễ hội',
    ],
  },
];

export const OTHER_SECTION = {
  id: 'other',
  icon: '☕',
  title: { vi: 'Tin khác', en: 'Other news' },
  bonus: 0,
};

/** Stories matching these are skipped (shopping lists, sponsored posts, job ads). */
export const EXCLUDE_PATTERNS = [
  /\b(deal|deals|% off|black friday|cyber monday|gift guide|coupon|promo code|on sale)\b/i,
  /\b(sponsored|partner content|advertorial|job opening|we're hiring|now hiring)\b/i,
  /\b(khuyến mãi|giảm giá|quảng cáo|tuyển dụng)\b/i,
];
