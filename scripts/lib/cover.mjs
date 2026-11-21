// Generates a language-neutral 1200×630 SVG cover for posts that don't ship their own.
// Style follows the category colours; shapes are seeded from the post id so each cover differs.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function rng(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Coffee bean shape centred at (x, y). */
const bean = (x, y, r, rot, fill = '#4a2a17') =>
  `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#sh)"><ellipse rx="${r}" ry="${r * 0.68}" fill="${fill}"/><path d="M${-r * 0.75} 0 C ${-r * 0.25} ${-r * 0.35}, ${r * 0.25} ${r * 0.35}, ${r * 0.75} 0" stroke="#e9c9a3" stroke-opacity=".55" stroke-width="${r * 0.1}" fill="none" stroke-linecap="round"/></g>`;

/** Scattered beans, seeded so every post gets its own arrangement. */
const beans = (r, n, area = [620, 90, 520, 470]) => {
  let s = '';
  for (let i = 0; i < n; i++)
    s += bean(
      area[0] + r() * area[2],
      area[1] + r() * area[3],
      18 + r() * 16,
      Math.round(r() * 180),
      i % 3 ? '#5a3320' : '#3a2014',
    );
  return s;
};

/** Steam wisps above (x, y). */
const steam = (x, y) =>
  [0, 1, 2]
    .map(
      (i) =>
        `<path d="M${x - 50 + i * 50} ${y} c -25 -40, 25 -60, 0 -100 c -25 -40, 25 -60, 0 -100" stroke="#fff" stroke-opacity=".45" stroke-width="10" fill="none" stroke-linecap="round"/>`,
    )
    .join('');

/** Category-specific motif drawn on the right side. */
const MOTIFS = {
  origins: (r) => {
    // a branch with leaves and ripe cherries
    let s = `<path d="M640 520 C 760 420, 860 330, 1120 120" stroke="#3b2a1a" stroke-width="12" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < 6; i++) {
      const t = 0.1 + i * 0.15;
      const x = 640 + t * 480;
      const y = 520 - t * 400;
      const side = i % 2 ? 1 : -1;
      s += `<ellipse cx="${x + side * 60}" cy="${y - side * 30}" rx="70" ry="26" transform="rotate(${-35 + side * 25} ${x + side * 60} ${y - side * 30})" fill="#4f7040" filter="url(#sh)"/>`;
      for (let k = 0; k < 3; k++)
        s += `<circle cx="${x - 14 + k * 16 + r() * 6}" cy="${y + 22 + (k % 2) * 12}" r="15" fill="${r() > 0.3 ? '#c0392b' : '#e67e22'}" filter="url(#sh)"/>`;
    }
    return s;
  },
  processing: (r) => {
    // raised drying bed with cherries
    let s = `<g filter="url(#sh)"><rect x="640" y="300" width="480" height="40" rx="10" fill="#e8d3b0"/><rect x="660" y="340" width="16" height="170" fill="#8a6a45"/><rect x="1084" y="340" width="16" height="170" fill="#8a6a45"/></g>`;
    for (let i = 0; i < 26; i++)
      s += `<circle cx="${660 + r() * 440}" cy="${292 - r() * 22}" r="${11 + r() * 5}" fill="${r() > 0.5 ? '#8e2a20' : '#c0392b'}"/>`;
    s += `<circle cx="1030" cy="150" r="58" fill="#fde68a"/>`;
    return s;
  },
  roasting: (r) => {
    // drum roaster silhouette + beans falling into the cooling tray
    let s = `<g filter="url(#sh)"><rect x="680" y="140" width="260" height="190" rx="40" fill="#2c1c13"/><circle cx="810" cy="235" r="62" fill="#4a2e1f" stroke="#c98a52" stroke-width="8"/><rect x="900" y="80" width="40" height="70" rx="8" fill="#2c1c13"/>
      <ellipse cx="900" cy="470" rx="210" ry="46" fill="#d9a066"/><ellipse cx="900" cy="460" rx="190" ry="34" fill="#6b3a1c"/></g>`;
    s += beans(r, 6, [760, 330, 260, 110]);
    return s;
  },
  brewing: () =>
    // pour-over dripper on a carafe
    `<g filter="url(#sh)"><path d="M760 170 H 1040 L 950 330 H 850 Z" fill="#fff"/><rect x="830" y="330" width="140" height="18" rx="6" fill="#f1e6d8"/>
      <path d="M800 360 H 1000 C 1040 420, 1040 520, 960 540 H 840 C 760 520, 760 420, 800 360 Z" fill="#fff" fill-opacity=".35" stroke="#fff" stroke-width="6"/>
      <path d="M812 470 C 830 510, 970 510, 988 470 C 990 500, 970 530, 900 532 C 830 530, 810 500, 812 470 Z" fill="#4a2a17"/></g>
     <path d="M1120 90 C 1080 90, 1060 120, 1030 160" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/>
     <path d="M1030 160 L 960 200" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round"/>`,
  espresso: () =>
    // espresso cup with crema
    `${steam(880, 230)}<g filter="url(#sh)"><ellipse cx="880" cy="500" rx="230" ry="44" fill="#fff" fill-opacity=".9"/>
      <path d="M720 300 H 1040 C 1040 420, 980 480, 880 480 C 780 480, 720 420, 720 300 Z" fill="#fff"/>
      <path d="M1040 330 C 1110 330, 1110 420, 1030 420" stroke="#fff" stroke-width="22" fill="none"/>
      <ellipse cx="880" cy="300" rx="160" ry="30" fill="#c98a52"/><ellipse cx="880" cy="300" rx="120" ry="20" fill="#a4561f"/></g>`,
  vietnam: () =>
    // phin dripping into a glass with condensed milk
    `<g filter="url(#sh)"><rect x="800" y="110" width="160" height="130" rx="12" fill="#cfd3d6"/><ellipse cx="880" cy="110" rx="80" ry="16" fill="#e5e7e9"/>
      <rect x="760" y="236" width="240" height="20" rx="10" fill="#b0b5b9"/>
      <path d="M800 270 H 960 L 945 530 H 815 Z" fill="#fff" fill-opacity=".35" stroke="#fff" stroke-width="6"/>
      <path d="M810 420 H 950 L 945 530 H 815 Z" fill="#3a2014"/><path d="M815 490 H 945 L 945 530 H 815 Z" fill="#f3e3c3"/></g>
     <circle cx="880" cy="300" r="7" fill="#3a2014"/><circle cx="880" cy="340" r="6" fill="#3a2014"/>`,
  tasting: (r) => {
    // cupping bowls and a spoon
    let s = '';
    for (let i = 0; i < 3; i++) {
      const x = 700 + i * 170;
      s += `<g filter="url(#sh)"><path d="M${x - 70} 330 H ${x + 70} C ${x + 70} 430, ${x + 30} 460, ${x} 460 C ${x - 30} 460, ${x - 70} 430, ${x - 70} 330 Z" fill="#fff"/><ellipse cx="${x}" cy="330" rx="70" ry="16" fill="${['#6b3a1c', '#8a5a3b', '#4a2a17'][i]}"/></g>`;
    }
    s += `<g filter="url(#sh)"><ellipse cx="1060" cy="200" rx="40" ry="26" fill="#e5e7e9"/><rect x="760" y="190" width="270" height="18" rx="9" fill="#e5e7e9" transform="rotate(-8 1060 200)"/></g>`;
    s += beans(r, 3, [660, 470, 440, 60]);
    return s;
  },
  gear: () =>
    // hand grinder + scale
    `<g filter="url(#sh)"><rect x="700" y="430" width="360" height="70" rx="16" fill="#2b2f33"/><rect x="900" y="448" width="130" height="34" rx="6" fill="#9fe7a8"/>
      <path d="M760 430 V 250 C 760 220, 860 220, 860 250 V 430 Z" fill="#c9cdd1"/><rect x="740" y="200" width="140" height="40" rx="10" fill="#8a6a45"/>
      <path d="M810 200 V 140 H 930" stroke="#2b2f33" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="950" cy="140" r="22" fill="#8a6a45"/></g>`,
  'coffee-news': (r) => {
    let s =
      '<g filter="url(#sh)"><rect x="660" y="120" width="440" height="400" rx="16" fill="#fffaf3"/>';
    s += '<rect x="690" y="150" width="380" height="34" rx="6" fill="#4f7040"/>';
    s += '<rect x="690" y="204" width="180" height="120" rx="8" fill="#d9a066"/>';
    for (let i = 0; i < 5; i++)
      s += `<rect x="890" y="${206 + i * 24}" width="${130 + Math.round(r() * 50)}" height="10" rx="5" fill="#e6d7c4"/>`;
    for (let c = 0; c < 3; c++)
      for (let i = 0; i < 6; i++)
        s += `<rect x="${690 + c * 130}" y="${350 + i * 24}" width="${80 + Math.round(r() * 30)}" height="9" rx="4" fill="#efe3d3"/>`;
    s += '</g>' + bean(1110, 140, 34, 30);
    return s;
  },
};

/**
 * @param {{ id:string, category:{id:string, icon:string, colors:string[]}, tags:string[], type?:string }} p
 */
export function renderCover({ id, category, tags = [], type }) {
  const r = rng(id);
  const [c1, c2] = category.colors ?? ['#6b3a1c', '#c46a2b'];
  const motif = (MOTIFS[category.id] ?? ((rr) => beans(rr, 9)))(r);
  const chips = tags
    .slice(0, 3)
    .map((t, i) => {
      const w = Math.max(90, t.length * 15 + 40);
      const x =
        80 + tags.slice(0, i).reduce((a, s) => a + Math.max(90, s.length * 15 + 40) + 14, 0);
      return `<g><rect x="${x}" y="470" width="${w}" height="48" rx="24" fill="#fff" fill-opacity=".16" stroke="#fff" stroke-opacity=".5"/><text x="${x + w / 2}" y="501" text-anchor="middle" font-family="'JetBrains Mono', Consolas, monospace" font-size="22" font-weight="700" fill="#fff">#${esc(t)}</text></g>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" font-family="Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#fff" fill-opacity=".12"/></pattern>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#1b0f08" flood-opacity=".28"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <circle cx="${980 + r() * 120}" cy="${60 + r() * 60}" r="200" fill="#fff" fill-opacity=".07"/>
  <circle cx="${80 + r() * 80}" cy="${560 + r() * 40}" r="180" fill="#fff" fill-opacity=".06"/>
  ${motif}
  <text x="80" y="250" font-size="150">${category.icon}</text>
  <text x="84" y="350" font-size="26" font-weight="800" fill="#fff" fill-opacity=".85" letter-spacing="6">${esc(type === 'note' ? 'NOTE' : type === 'news' ? 'WEEKLY NEWS' : type === 'guide' ? 'BREW GUIDE' : category.id.toUpperCase().replace(/-/g, ' '))}</text>
  ${chips}
</svg>`;
}
