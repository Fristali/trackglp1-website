#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const contentDir = path.join(root, 'content');
const templatesDir = path.join(root, 'templates');
const guidesDir = path.join(root, 'guides');

const SITE_URL = 'https://trackglp1.com';

const guides = JSON.parse(fs.readFileSync(path.join(contentDir, 'guides.json'), 'utf8'));
const updates = JSON.parse(fs.readFileSync(path.join(contentDir, 'updates.json'), 'utf8'));
const guideTemplate = fs.readFileSync(path.join(templatesDir, 'guide.template.html'), 'utf8');
const updatesTemplate = fs.readFileSync(path.join(templatesDir, 'updates.template.html'), 'utf8');

if (!fs.existsSync(guidesDir)) {
  fs.mkdirSync(guidesDir, { recursive: true });
}

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatWithCitations = (text) => {
  const escaped = escapeHtml(text);
  return escaped.replace(/\[(C\d+)\]/g, '<a class="citation-chip" href="#cite-$1">[$1]</a>');
};

const toListItems = (items) => items.map((item) => `<li>${formatWithCitations(item)}</li>`).join('\n            ');

const statusClass = (status) => {
  if (status === 'approved') return 'status-approved';
  if (status === 'experimental') return 'status-experimental';
  if (status === 'discontinued') return 'status-discontinued';
  if (status === 'nutrient') return 'status-nutrient';
  if (status === 'regional-approval') return 'status-regional';
  return 'status-support';
};

const warningBlock = (guide) => {
  if (!['experimental', 'discontinued', 'regional-approval'].includes(guide.status)) {
    return '';
  }

  const warning = guide.status === 'discontinued'
    ? 'Legacy or discontinued status: availability, safety documentation, and market oversight may differ by region and date.'
    : guide.status === 'regional-approval'
      ? 'Regional approval status: this therapy may be approved in some jurisdictions but not others.'
      : 'Experimental status: investigational therapies may have limited long-term safety/efficacy evidence.';

  return `<section class="guide-section warning-box">
        <h2>Important Status Notice</h2>
        <p>${escapeHtml(warning)}</p>
        <p>Use this page for education and tracking preparation only. Clinical decisions should be made with a licensed provider.</p>
      </section>`;
};

const writeGuidePages = () => {
  const expectedFiles = new Set(guides.map((guide) => `${guide.slug}.html`));

  for (const entry of fs.readdirSync(guidesDir)) {
    if (!entry.endsWith('.html')) continue;
    if (!expectedFiles.has(entry)) {
      fs.unlinkSync(path.join(guidesDir, entry));
    }
  }

  for (const guide of guides) {
    const citationsHtml = guide.citations.map((citation) => {
      const citationId = escapeHtml(citation.id);
      const title = escapeHtml(citation.title);
      const publisher = escapeHtml(citation.publisher);
      const sourceType = escapeHtml(citation.sourceType);
      const publishedDate = escapeHtml(citation.publishedDate);
      const accessedDate = escapeHtml(citation.accessedDate);
      const url = escapeHtml(citation.url);

      return `<li id="cite-${citationId}">
              <strong>[${citationId}] ${title}</strong><br>
              <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a><br>
              <span class="citation-meta">${sourceType} · ${publisher} · Published ${publishedDate} · Accessed ${accessedDate}</span>
            </li>`;
    }).join('\n            ');

    const aliases = Array.isArray(guide.aliases) && guide.aliases.length > 0
      ? guide.aliases.map((alias) => escapeHtml(alias)).join(', ')
      : 'No common aliases listed';

    const canonicalUrl = `${SITE_URL}/guides/${guide.slug}.html`;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'MedicalWebPage',
      name: `${guide.title} Guide`,
      url: canonicalUrl,
      dateModified: guide.lastReviewed,
      description: guide.metaDescription,
      about: {
        '@type': 'Drug',
        name: guide.title,
        alternateName: guide.aliases
      },
      publisher: {
        '@type': 'Organization',
        name: 'ShotClock'
      }
    };

    let page = guideTemplate;
    page = page.replace(/{{TITLE}}/g, escapeHtml(guide.title));
    page = page.replace(/{{META_DESCRIPTION}}/g, escapeHtml(guide.metaDescription));
    page = page.replace(/{{CANONICAL_URL}}/g, escapeHtml(canonicalUrl));
    page = page.replace(/{{JSON_LD}}/g, JSON.stringify(jsonLd, null, 2));
    page = page.replace(/{{STATUS_CLASS}}/g, statusClass(guide.status));
    page = page.replace(/{{STATUS_LABEL}}/g, escapeHtml(guide.statusLabel || guide.status));
    page = page.replace(/{{CATEGORY}}/g, escapeHtml(guide.category));
    page = page.replace(/{{LAST_REVIEWED}}/g, escapeHtml(guide.lastReviewed));
    page = page.replace(/{{HERO_SUMMARY}}/g, escapeHtml(guide.heroSummary));
    page = page.replace(/{{ALIASES}}/g, aliases);
    page = page.replace(/{{WARNING_BLOCK}}/g, warningBlock(guide));
    page = page.replace(/{{DOSING_OVERVIEW}}/g, formatWithCitations(guide.dosingSection.overview));
    page = page.replace(/{{PROTOCOL_PATTERNS_HTML}}/g, toListItems(guide.dosingSection.protocolPatterns));
    page = page.replace(/{{MONITORING_WINDOWS_HTML}}/g, toListItems(guide.dosingSection.monitoringWindows));
    page = page.replace(/{{TRACKING_SIGNALS_HTML}}/g, toListItems(guide.trackingSignals));
    page = page.replace(/{{SAFETY_FLAGS_HTML}}/g, toListItems(guide.safetyFlags));
    page = page.replace(/{{PROVIDER_QUESTIONS_HTML}}/g, toListItems(guide.providerQuestions));
    page = page.replace(/{{CITATIONS_HTML}}/g, citationsHtml);

    fs.writeFileSync(path.join(guidesDir, `${guide.slug}.html`), page);
  }
};

const writeUpdatesPage = () => {
  const updatesHtml = updates
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((item) => {
      const impacted = (item.impactedGuides || [])
        .map((slug) => `<a href="guides/${escapeHtml(slug)}.html" class="update-link">${escapeHtml(slug)}</a>`)
        .join(' ');

      return `<article class="update-card" id="${escapeHtml(item.id)}">
          <div class="update-head">
            <p class="update-date">${escapeHtml(item.date)}</p>
            <span class="status-badge status-category">v${escapeHtml(item.version || '1.0.0')}</span>
          </div>
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.summary)}</p>
          <div class="update-impacted">
            <h3>Impacted guides</h3>
            <p>${impacted}</p>
          </div>
        </article>`;
    })
    .join('\n\n        ');

  const page = updatesTemplate.replace('{{UPDATES_ITEMS_HTML}}', updatesHtml);
  fs.writeFileSync(path.join(root, 'updates.html'), page);
};

const writeUpdatesFeed = () => {
  const feedItems = updates
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((item) => {
      const url = `${SITE_URL}/updates.html#${item.id}`;
      return `<entry>
    <id>${escapeHtml(`${SITE_URL}/updates/${item.id}`)}</id>
    <title>${escapeHtml(item.title)}</title>
    <updated>${escapeHtml(item.date)}T00:00:00Z</updated>
    <link href="${escapeHtml(url)}"/>
    <summary>${escapeHtml(item.summary)}</summary>
  </entry>`;
    })
    .join('\n');

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${SITE_URL}/updates.xml</id>
  <title>ShotClock Guide Updates</title>
  <updated>${updates[0]?.date || '2026-02-22'}T00:00:00Z</updated>
  <link href="${SITE_URL}/updates.xml" rel="self"/>
  <link href="${SITE_URL}/updates.html"/>
  <author><name>ShotClock</name></author>
${feedItems}
</feed>
`;

  fs.writeFileSync(path.join(root, 'updates.xml'), feed);
};

const writeSitemap = () => {
  const staticPaths = [
    '/',
    '/index.html',
    '/library.html',
    '/updates.html',
    '/support.html',
    '/privacy.html',
    '/terms.html'
  ];

  const guidePaths = guides.map((guide) => `/guides/${guide.slug}.html`);
  const allPaths = [...new Set([...staticPaths, ...guidePaths])];

  const entries = allPaths
    .map((urlPath) => `  <url>\n    <loc>${SITE_URL}${urlPath}</loc>\n    <lastmod>2026-02-22</lastmod>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

  fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
};

const writeRobots = () => {
  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

  fs.writeFileSync(path.join(root, 'robots.txt'), robots);
};

writeGuidePages();
writeUpdatesPage();
writeUpdatesFeed();
writeSitemap();
writeRobots();

console.log(`Generated ${guides.length} guide pages.`);
console.log('Generated updates.html, updates.xml, sitemap.xml, and robots.txt.');
