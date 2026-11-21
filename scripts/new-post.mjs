#!/usr/bin/env node
// Scaffold a new bilingual post.
//
//   npm run new-post -- --category=brewing --title="AeroPress ngược" [--type=guide --method=aeropress] [--level=beginner] [--tags=a,b] [--series=id --order=3]
//
// Creates public/content/posts/<id>.vi.md and <id>.en.md with front matter filled in.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringifyFrontmatter } from './lib/frontmatter.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = join(root, 'public', 'content');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=') || true];
  }),
);

const categories = JSON.parse(readFileSync(join(content, 'categories.json'), 'utf8'));
if (!args.title || !args.category) {
  console.error(
    'Usage: npm run new-post -- --category=<id> --title="..." [--type=article|note|guide] [--method=v60] [--level=beginner] [--tags=a,b] [--series=id --order=n]',
  );
  console.error('Categories: ' + categories.map((c) => c.id).join(', '));
  process.exit(1);
}
if (!categories.some((c) => c.id === args.category)) {
  console.error(
    `Unknown category "${args.category}". Use one of: ${categories.map((c) => c.id).join(', ')}`,
  );
  process.exit(1);
}

const slug = String(args.slug ?? args.title)
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/đ/gi, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const today = new Date().toISOString().slice(0, 10);
const type = ['note', 'guide'].includes(args.type) ? args.type : 'article';

for (const lang of ['vi', 'en']) {
  const file = join(content, 'posts', `${slug}.${lang}.md`);
  if (existsSync(file)) {
    console.error(`Already exists: ${file}`);
    process.exit(1);
  }
  const fm = stringifyFrontmatter({
    title: lang === 'vi' ? args.title : `${args.title} (EN)`,
    summary:
      lang === 'vi' ? 'Tóm tắt một câu về nội dung bài viết.' : 'One-sentence summary of the post.',
    date: today,
    category: args.category,
    tags: args.tags
      ? String(args.tags)
          .split(',')
          .map((t) => t.trim())
      : [],
    type,
    series: args.series,
    seriesOrder: args.series ? Number(args.order) || 1 : undefined,
    level: args.level,
    method: args.method,
  });
  const method = args.method || 'v60';
  const guide =
    lang === 'vi'
      ? `> [!NOTE]\n> Công thức này cho ra ly gì, hợp với loại hạt nào.\n\n## Chuẩn bị\n\n\`\`\`brew-calc\nmethod: ${method}\n\`\`\`\n\n## Các bước\n\n\`\`\`brew-timer\nmethod: ${method}\n\`\`\`\n\n## Chỉnh vị\n\n- Chua quá → xay mịn hơn\n- Đắng quá → xay thô hơn\n`
      : `> [!NOTE]\n> What this recipe makes and which beans suit it.\n\n## Setup\n\n\`\`\`brew-calc\nmethod: ${method}\n\`\`\`\n\n## Steps\n\n\`\`\`brew-timer\nmethod: ${method}\n\`\`\`\n\n## Dialling in\n\n- Too sour → grind finer\n- Too bitter → grind coarser\n`;
  const body =
    type === 'guide'
      ? guide
      : type === 'note'
        ? lang === 'vi'
          ? 'Ghi chép ngắn: điều vừa học được, kèm một ví dụ.\n'
          : 'A short note: what you just learned, with one example.\n'
        : lang === 'vi'
          ? '> [!NOTE]\n> Mở bài: bài viết giải quyết câu hỏi gì.\n\n## Phần 1\n\nNội dung…\n\n## Tóm tắt\n\n- …\n'
          : '> [!NOTE]\n> Intro: what question this post answers.\n\n## Part 1\n\nContent…\n\n## Summary\n\n- …\n';
  writeFileSync(file, `${fm}\n${body}`);
  console.log(`✍️  Created ${file}`);
}
console.log('Run `npm run content` (or restart `npm start`) to see it in the app.');
