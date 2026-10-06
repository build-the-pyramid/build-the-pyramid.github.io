import { readdirSync, statSync, existsSync } from 'node:fs';
import { root, read, home, pages, blueprint, host, draft, check, finish, forbidden, validate } from './validate.mjs';

validate();
const decode = (value) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const normalize = (value) => decode(value).replace(/\s+/g, ' ').trim();
const plain = (value) => normalize(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' '));
const attr = (tag, name) => decode(tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? '');
const tags = (html, tag) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map((match) => match[0]);
const wordCount = (text) => text.match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/gi)?.length ?? 0;
const all = [home, ...pages];
const legal = ['about', 'privacy', 'terms', 'copyright'];
const routes = new Set(['/', ...pages.map((page) => `/${page.slug}/`), ...legal.map((slug) => `/${slug}/`)]);

check(existsSync(new URL('out/index.html', root)), 'Static export is missing; run build first');
if (!existsSync(new URL('out/index.html', root))) finish('SEO audit');
for (const page of all) {
  const slug = page.slug;
  const path = slug ? `${slug}/index.html` : 'index.html';
  const file = new URL(`out/${path}`, root);
  check(existsSync(file), `${path}: missing export`);
  if (!existsSync(file)) continue;
  const html = read(`out/${path}`);
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
  const text = plain(main);
  const canonical = `${host}/${slug ? `${slug}/` : ''}`;
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const meta = (name) => tags(html, 'meta').find((tag) => attr(tag, 'name') === name);
  const property = (name) => tags(html, 'meta').find((tag) => attr(tag, 'property') === name);
  check(title === blueprint[slug].title, `${path}: wrong rendered title`);
  check(attr(meta('description') ?? '', 'content') === blueprint[slug].description, `${path}: wrong meta description`);
  check(attr(tags(html, 'link').find((tag) => attr(tag, 'rel') === 'canonical') ?? '', 'href') === canonical, `${path}: wrong canonical`);
  check(draft || attr(meta('robots') ?? '', 'content') === 'index, follow', `${path}: not index/follow`);
  check(tags(main, 'h1').length === 1, `${path}: H1 count is not one`);
  check(normalize(main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '') === page.hero.heading, `${path}: wrong H1`);
  const reviewedDate = new Date(`${page.lastReviewed}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  check(text.includes(`Last updated: ${reviewedDate}`), `${path}: no visible updated date`);
  check(text.includes('Frequently Asked Questions'), `${path}: FAQ missing`);
  check(!forbidden.test(text), `${path}: forbidden player-visible text`);
  check(html.includes('aria-controls="primary-navigation"') && html.includes('aria-label="Open navigation"'), `${path}: mobile navigation missing`);
  for (const child of pages) {
    const href = `/${child.slug}/`;
    check(html.includes(`href="${href}"`), `${path}: inaccessible guide ${href}`);
    const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1] ?? '';
    check(footer.includes(`href="${href}"`), `${path}: footer missing ${href}`);
  }
  for (const section of page.sections) {
    const sectionHtml = main.match(new RegExp(`<section id="${section.id}"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1] ?? '';
    const visible = plain(sectionHtml);
    check(visible.includes(section.heading), `${path}: invisible H2 ${section.heading}`);
    for (const paragraph of [section.intro, ...(section.paragraphs ?? [])].filter(Boolean)) check(visible.includes(normalize(paragraph)), `${path}: invisible paragraph in ${section.id}`);
    for (const sub of section.subsections ?? []) {
      check(visible.includes(sub.heading), `${path}: invisible H3 ${sub.heading}`);
      for (const paragraph of [...sub.paragraphs, ...(sub.bullets ?? [])]) check(visible.includes(normalize(paragraph)), `${path}: invisible subsection text`);
      if (sub.bullets?.length) check(sectionHtml.includes('<ul'), `${path}: bullets not rendered`);
    }
    for (const table of [section.table, ...(section.subsections ?? []).map((sub) => sub.table)].filter(Boolean)) {
      check(sectionHtml.includes('<table'), `${path}: table missing`);
      for (const cell of [table.caption, ...table.columns, ...table.rows.flat()]) check(visible.includes(normalize(cell)), `${path}: table cell not rendered: ${cell}`);
    }
    for (const step of section.steps ?? []) check(sectionHtml.includes('<ol') && visible.includes(normalize(step.description)), `${path}: step missing`);
    for (const link of section.links ?? []) check(sectionHtml.includes(`href="/${link.slug}/"`), `${path}: internal content link missing`);
  }
  for (const item of page.faq) check(text.includes(item.question) && text.includes(normalize(item.answer)), `${path}: FAQ mismatch`);
  for (const name of ['og:title', 'og:description', 'og:url', 'og:image']) check(Boolean(property(name)), `${path}: missing ${name}`);
  check(attr(property('og:url') ?? '', 'content') === canonical, `${path}: incorrect OG URL`);
  check(Boolean(meta('twitter:card') && meta('twitter:title') && meta('twitter:image')), `${path}: Twitter metadata missing`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((match) => { try { const data = JSON.parse(match[1]); return Array.isArray(data) ? data : [data]; } catch { check(false, `${path}: invalid JSON-LD`); return []; } });
  const types = schemas.map((schema) => schema['@type']);
  for (const type of slug ? ['WebPage', 'BreadcrumbList', 'FAQPage'] : ['WebSite', 'VideoGame', 'FAQPage']) check(types.includes(type), `${path}: schema ${type} missing`);
  check(!types.some((type) => ['Review', 'AggregateRating', 'Product', 'Offer'].includes(type)), `${path}: unsupported schema`);
  const faq = schemas.find((schema) => schema['@type'] === 'FAQPage');
  check(faq?.mainEntity?.length === page.faq.length, `${path}: schema FAQ count mismatch`);
  const how = schemas.find((schema) => schema['@type'] === 'HowTo');
  if (how) check(how.step.length === page.sections.flatMap((section) => section.steps ?? []).length, `${path}: schema steps mismatch`);
  const count = wordCount(text);
  check(count >= (slug ? 800 : 1200), `${path}: too little visible content (${count} words)`);
  console.log(`${slug || '/'}: ${count} visible main-content words, title ${title.length}, description ${page.description.length}`);
}
const sitemap = read('out/sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]).sort();
check(urls.length === 11 && JSON.stringify(urls) === JSON.stringify(all.map((page) => `${host}/${page.slug ? `${page.slug}/` : ''}`).sort()), 'Sitemap must contain exactly the 11 SEO URLs');
check(draft || /Allow: \/\s/.test(read('out/robots.txt')), 'Robots blocks launch pages');
check(read('out/robots.txt').includes(`${host}/sitemap.xml`), 'Robots sitemap URL is wrong');
check(!existsSync(new URL('out/wiki/index.html', root)), 'Unexpected exported wiki page');
check(!existsSync(new URL('out/contact/index.html', root)), 'Unexpected contact page');
for (const slug of legal) check(read(`out/${slug}/index.html`).includes('content="noindex, follow"'), `${slug}: legal page should be noindex`);
check(read('out/404.html').includes('content="noindex, nofollow"'), '404 should be noindex');
check(!forbidden.test(plain(read('out/404.html'))), '404 has internal copy');
const manifest = JSON.parse(read('out/manifest.webmanifest'));
check(manifest.icons.every((icon) => icon.type === 'image/webp'), 'Manifest icon MIME is incorrect');
check(existsSync(new URL('out/.nojekyll', root)), 'GitHub Pages .nojekyll missing');
function walk(path) { return readdirSync(new URL(path, root)).flatMap((name) => { const child = `${path}/${name}`; return statSync(new URL(child, root)).isDirectory() ? walk(child) : [child]; }); }
for (const path of walk('out')) {
  if (!/\.(html|txt|xml|json|svg|webmanifest)$/.test(path)) continue;
  const raw = read(path);
  // Standalone ad documents intentionally contain no site analytics or SEO.
  if (path.endsWith('.html') && !path.startsWith('out/ads/')) {
    const head = raw.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
    const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || JSON.parse(read('content/generated/integrations.json')).gaMeasurementId;
    if (/^G-[A-Z0-9]+$/i.test(id ?? '')) {
      const loaders = tags(raw, 'script').filter((tag) => attr(tag, 'src').startsWith('https://www.googletagmanager.com/gtag/js?'));
      const setups = tags(raw, 'script').filter((tag) => attr(tag, 'id') === 'google-analytics');
      check(loaders.length === 1 && setups.length === 1, `${path}: Google tag must appear exactly once`);
      check(head.startsWith('<!-- Google tag (gtag.js) -->' + loaders[0]), `${path}: Google tag must immediately follow the opening head`);
      check(head.includes(`gtag('config', '${id.toUpperCase()}');`) && head.includes('id="google-analytics"'), `${path}: GA configuration missing from head`);
      check(attr(loaders[0] ?? '', 'src') === `https://www.googletagmanager.com/gtag/js?id=${id.toUpperCase()}`, `${path}: GA measurement ID mismatch`);
    }
  }
  // HTML scripts contain framework internals; scan actual rendered copy separately.
  const publicText = path.endsWith('.html') ? plain(raw) : raw;
  check(!forbidden.test(publicText), `${path}: forbidden public residue`);
  check(!/example\.github\.io|Riftfall Survival|Yorich|Fact Pack|Evidence ID|Generated by|waiting to be added/.test(raw), `${path}: internal data leak`);
  if (path.endsWith('.html')) {
    for (const tag of tags(raw, 'a')) {
      const href = attr(tag, 'href');
      if (href.startsWith('/')) check(routes.has(href.split('#')[0]), `${path}: broken internal link ${href}`);
    }
    for (const tag of [...tags(raw, 'script'), ...tags(raw, 'img'), ...tags(raw, 'link')]) {
      const url = attr(tag, 'src') || (attr(tag, 'rel') === 'stylesheet' || attr(tag, 'rel') === 'icon' ? attr(tag, 'href') : '');
      if (url.startsWith('/')) check(existsSync(new URL(`out${url.split('?')[0]}`, root)), `${path}: missing local asset ${url}`);
    }
  }
}
finish('Exported SEO audit');
