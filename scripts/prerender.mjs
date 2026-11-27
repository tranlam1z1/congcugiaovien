// Dựng sẵn HTML cho từng đường dẫn công khai (SEO).
// Đặt SITE_URL=https://ten-mien để sinh thêm sitemap.xml, canonical và og:url.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const serverDir = path.join(root, 'dist-ssr');
const siteUrl = process.env.SITE_URL?.replace(/\/+$/, '');

const { render, publicPaths, seoFor } = await import(
  pathToFileURL(path.join(serverDir, 'entry-server.js')).href
);
const template = await readFile(path.join(dist, 'index.html'), 'utf8');

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function head(url, seo) {
  const tags = [
    `<title>${escape(seo.title)}</title>`,
    `<meta name="description" content="${escape(seo.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="vi_VN" />`,
    `<meta property="og:title" content="${escape(seo.title)}" />`,
    `<meta property="og:description" content="${escape(seo.description)}" />`,
  ];
  if (seo.noindex) tags.push('<meta name="robots" content="noindex" />');
  if (siteUrl && !seo.noindex) {
    tags.push(`<link rel="canonical" href="${siteUrl}${url}" />`);
    tags.push(`<meta property="og:url" content="${siteUrl}${url}" />`);
  }
  for (const data of seo.jsonLd ?? []) {
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }
  return tags.join('\n    ');
}

async function page(url, file, dataPath = url) {
  const html = await render(url);
  const output = template
    .replace(/<!--seo-start-->[\s\S]*<!--seo-end-->/, () => head(url, seoFor(url)))
    .replace(
      '<div id="root"><!--app-html--></div>',
      () => `<div id="root" data-path="${dataPath}">${html}</div>`,
    );
  if (!output.includes('data-path=')) throw new Error('index.html thiếu chỗ chèn <!--app-html-->');
  const target = path.join(dist, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, output);
}

const paths = publicPaths();
// "/phieu-toan" ghi thành phieu-toan.html: host tĩnh phục vụ không cần dấu / cuối.
for (const url of paths) await page(url, url === '/' ? 'index.html' : `${url.slice(1)}.html`);
// Đường dẫn lạ nhận 404.html; data-path rỗng để trình duyệt vẽ lại theo URL thật.
await page('/404', '404.html', '');

if (siteUrl) {
  const urls = paths.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join('\n');
  await writeFile(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
  await writeFile(path.join(dist, 'robots.txt'), `${robots}Sitemap: ${siteUrl}/sitemap.xml\n`);
}

await rm(serverDir, { recursive: true, force: true });
console.log(`Đã prerender ${paths.length + 1} trang${siteUrl ? ' và sitemap.xml' : ''}.`);
