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
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const guides = JSON.parse(fs.readFileSync(path.join(contentDir, 'guides.json'), 'utf8'));
const guideTemplate = fs.readFileSync(path.join(templatesDir, 'guide.template.html'), 'utf8');

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

const CONFIDENCE_LABELS = {
  high: 'High confidence',
  moderate: 'Moderate confidence',
  low: 'Low confidence',
  insufficient: 'Insufficient evidence'
};

const confidenceClass = (confidence) => {
  if (confidence === 'high') return 'high';
  if (confidence === 'moderate') return 'moderate';
  if (confidence === 'insufficient') return 'insufficient';
  return 'low';
};

const confidenceChip = (confidence) => {
  const key = confidenceClass(confidence);
  const label = CONFIDENCE_LABELS[key];
  return `<span class="confidence-chip confidence-${key}">${escapeHtml(label)}</span>`;
};

const confidenceChipForSection = (guide, sectionKey) => {
  const sections = guide.evidenceProfile?.bySection || [];
  const section = sections.find((entry) => entry.sectionKey === sectionKey);
  return confidenceChip(section?.confidence || guide.evidenceProfile?.overall || 'low');
};

const REGULATORY_LABELS = {
  approved_label: 'Regulatory: Approved Label Context',
  regional_label: 'Regulatory: Regional Label Context',
  off_label_context: 'Regulatory: Off-Label / Limited Label Context',
  investigational: 'Regulatory: Investigational',
  unregulated_market: 'Regulatory: Unregulated Market',
  nutrient_support: 'Regulatory: Nutrient Support Context'
};

const regulatoryClassName = (classification) => {
  if (classification === 'approved_label') return 'regulatory-approved';
  if (classification === 'regional_label') return 'regulatory-regional';
  if (classification === 'nutrient_support') return 'regulatory-nutrient';
  if (classification === 'off_label_context') return 'regulatory-offlabel';
  if (classification === 'unregulated_market') return 'regulatory-unregulated';
  return 'regulatory-investigational';
};

const warningBlock = (guide) => {
  const classification = guide.regulatoryContext?.classification;
  if (!['experimental', 'discontinued', 'regional-approval'].includes(guide.status)
    && !['investigational', 'unregulated_market', 'off_label_context'].includes(classification)) {
    return '';
  }

  const warning = classification === 'unregulated_market'
    ? 'Unregulated market context: authoritative safety oversight and standardized product quality may be absent.'
    : classification === 'investigational'
      ? 'Investigational context: no broadly established regulated dosing protocol exists, and long-term safety may remain uncertain.'
      : guide.status === 'discontinued'
        ? 'Legacy or discontinued status: availability, safety documentation, and market oversight may differ by region and date.'
        : guide.status === 'regional-approval'
          ? 'Regional approval status: this therapy may be approved in some jurisdictions but not others.'
          : 'Off-label or limited-label context: recommendations vary by clinician judgment and local regulatory status.';

  return `<section class="guide-section warning-box">
        <h2>Important Status Notice</h2>
        <p>${escapeHtml(warning)}</p>
        <p>Use this page for education and tracking preparation only. It is not a directive to start, stop, increase, or schedule use.</p>
      </section>`;
};

const taxonomyChips = (guide) => {
  const taxonomy = guide.taxonomy || {};
  const groups = [
    ['Class', taxonomy.classTags || []],
    ['Status', taxonomy.statusTags || []],
    ['Route', taxonomy.routeTags || []],
    ['Format', taxonomy.formatTags || []]
  ];

  return groups
    .flatMap(([group, tags]) => tags.map((tag) => `<span class="taxonomy-chip"><span class="taxonomy-chip-label">${escapeHtml(group)}</span>${escapeHtml(tag)}</span>`))
    .join('\n          ');
};

const acronymPanel = (guide) => {
  const acronym = guide.acronymInfo;
  if (!acronym || !acronym.code) return '';

  const meaning = acronym.meaning
    ? `<p><strong>Meaning:</strong> ${escapeHtml(acronym.meaning)}</p>`
    : '<p><strong>Meaning:</strong> Not publicly defined by the source materials.</p>';

  const note = acronym.note ? `<p>${escapeHtml(acronym.note)}</p>` : '';

  return `<section class="guide-section acronym-panel">
        <h2>Acronym Context</h2>
        <p><strong>Code:</strong> ${escapeHtml(acronym.code)}</p>
        ${meaning}
        ${note}
      </section>`;
};

const compositionPanel = (guide) => {
  if (!Array.isArray(guide.composition) || guide.composition.length === 0) return '';

  const items = guide.composition
    .map((component) => {
      const amount = component.amount ? ` <span class="composition-amount">${escapeHtml(component.amount)}</span>` : '';
      return `<li><span class="composition-name">${escapeHtml(component.name)}</span>${amount}</li>`;
    })
    .join('\n            ');

  return `<section class="guide-section composition-panel">
        <h2>Composition</h2>
        <ul class="composition-list">
            ${items}
        </ul>
      </section>`;
};

const unique = (values) => {
  const result = [];
  for (const item of values) {
    if (!item || result.includes(item)) continue;
    result.push(item);
  }
  return result;
};

const evidenceBySectionHtml = (guide) => {
  const sections = guide.evidenceProfile?.bySection || [];
  if (sections.length === 0) {
    return '<p class="evidence-empty">No section-level evidence map is available.</p>';
  }

  return sections.map((entry) => {
    const key = escapeHtml(entry.sectionKey || 'section');
    const rationale = escapeHtml(entry.rationale || 'No rationale provided.');
    const citations = (entry.citationIds || []).map((id) => `<a class="citation-chip" href="#cite-${escapeHtml(id)}">[${escapeHtml(id)}]</a>`).join(' ');
    return `<article class="evidence-item">
            <div class="evidence-item-head">
              <span class="evidence-key">${key}</span>
              ${confidenceChip(entry.confidence)}
            </div>
            <p>${rationale}</p>
            <div class="evidence-citations">${citations}</div>
          </article>`;
  }).join('\n          ');
};

const communitySectionHtml = (guide) => {
  const community = guide.communityReports;
  if (!community || !community.included) return '';

  return `<section class="guide-section community-panel">
          <h2>Community-Reported Patterns ${confidenceChip(community.confidence || 'low')}</h2>
          <p class="community-policy">Summarized context only. No public forum links are provided and this is not medical instruction.</p>
          <ul>
            ${toListItems(community.summary || [])}
          </ul>
          <p class="community-caution">${escapeHtml(community.safetyCaution || '')}</p>
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
    const displayTitle = guide.displayTitle || guide.title;
    const subtitle = guide.subtitle || guide.heroSummary;

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
    const alternateNames = unique([guide.title, ...(guide.aliases || [])]);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'MedicalWebPage',
      name: `${displayTitle} Guide`,
      url: canonicalUrl,
      dateModified: guide.lastReviewed,
      description: guide.metaDescription,
      about: {
        '@type': 'Drug',
        name: displayTitle,
        alternateName: alternateNames
      },
      publisher: {
        '@type': 'Organization',
        name: 'ShotClock'
      }
    };

    let page = guideTemplate;
    page = page.replace(/{{SEO_TITLE}}/g, escapeHtml(`${displayTitle} Guide - ShotClock Learn`));
    page = page.replace(/{{DISPLAY_TITLE}}/g, escapeHtml(displayTitle));
    page = page.replace(/{{SUBTITLE}}/g, escapeHtml(subtitle));
    page = page.replace(/{{META_DESCRIPTION}}/g, escapeHtml(guide.metaDescription));
    page = page.replace(/{{CANONICAL_URL}}/g, escapeHtml(canonicalUrl));
    page = page.replace(/{{JSON_LD}}/g, JSON.stringify(jsonLd, null, 2));
    page = page.replace(/{{STATUS_CLASS}}/g, statusClass(guide.status));
    page = page.replace(/{{STATUS_LABEL}}/g, escapeHtml(guide.statusLabel || guide.status));
    page = page.replace(/{{CATEGORY}}/g, escapeHtml(guide.category));
    page = page.replace(/{{REGULATORY_CLASS_LABEL}}/g, escapeHtml(REGULATORY_LABELS[guide.regulatoryContext?.classification] || 'Regulatory: Context Not Classified'));
    page = page.replace(/{{REGULATORY_CLASS_CHIP_CLASS}}/g, regulatoryClassName(guide.regulatoryContext?.classification));
    page = page.replace(/{{LAST_REVIEWED}}/g, escapeHtml(guide.lastReviewed));
    page = page.replace(/{{HERO_SUMMARY}}/g, escapeHtml(guide.heroSummary));
    page = page.replace(/{{LEGAL_NOTICE}}/g, escapeHtml(guide.regulatoryContext?.legalNotice || 'Use educational content as context for provider discussions only.'));
    page = page.replace(/{{ALIASES}}/g, aliases);
    page = page.replace(/{{TAXONOMY_CHIPS_HTML}}/g, taxonomyChips(guide));
    page = page.replace(/{{ACRONYM_PANEL_HTML}}/g, acronymPanel(guide));
    page = page.replace(/{{COMPOSITION_PANEL_HTML}}/g, compositionPanel(guide));
    page = page.replace(/{{WARNING_BLOCK}}/g, warningBlock(guide));
    page = page.replace(/{{USE_CASES_HTML}}/g, toListItems(guide.useCases || []));
    page = page.replace(/{{RISK_WHO_DISCUSS_HTML}}/g, toListItems(guide.riskScreen?.whoMayDiscussWithProvider || guide.candidateProfile || []));
    page = page.replace(/{{RISK_WHO_AVOID_HTML}}/g, toListItems(guide.riskScreen?.whoShouldAvoidOrPause || guide.avoidanceFlags || []));
    page = page.replace(/{{RISK_SIDE_EFFECTS_COMMON_HTML}}/g, toListItems(guide.riskScreen?.sideEffectsCommon || guide.sideEffects?.common || []));
    page = page.replace(/{{RISK_SIDE_EFFECTS_SERIOUS_HTML}}/g, toListItems(guide.riskScreen?.sideEffectsSerious || guide.sideEffects?.serious || []));
    page = page.replace(/{{RISK_EMERGENCY_SIGNALS_HTML}}/g, toListItems(guide.riskScreen?.emergencySignals || []));
    page = page.replace(/{{DOSING_PACE_PRINCIPLES_HTML}}/g, toListItems(guide.dosingFramework?.pacePrinciples || []));
    page = page.replace(/{{DOSING_HOLD_TRIGGERS_HTML}}/g, toListItems(guide.dosingFramework?.holdTriggers || []));
    page = page.replace(/{{DOSING_RESUME_CRITERIA_HTML}}/g, toListItems(guide.dosingFramework?.resumeCriteria || []));
    page = page.replace(/{{DOSING_TRACKING_FOCUS_HTML}}/g, toListItems(guide.dosingFramework?.trackingFocus || []));
    page = page.replace(/{{DOSING_UNCERTAINTY_STATEMENT}}/g, escapeHtml(guide.dosingFramework?.uncertaintyStatement || 'Evidence confidence varies by source quality and population context.'));
    page = page.replace(/{{EVIDENCE_OVERALL_CLASS}}/g, confidenceClass(guide.evidenceProfile?.overall || 'low'));
    page = page.replace(/{{EVIDENCE_OVERALL_LABEL}}/g, escapeHtml(CONFIDENCE_LABELS[confidenceClass(guide.evidenceProfile?.overall || 'low')]));
    page = page.replace(/{{EVIDENCE_OVERALL_RATIONALE}}/g, escapeHtml(guide.evidenceProfile?.overallRationale || 'Confidence reflects source quality, consistency, and directness.'));
    page = page.replace(/{{EVIDENCE_BY_SECTION_HTML}}/g, evidenceBySectionHtml(guide));
    page = page.replace(/{{EVIDENCE_DATA_GAPS_HTML}}/g, toListItems(guide.evidenceProfile?.dataGaps || []));
    page = page.replace(/{{COMMUNITY_SECTION_HTML}}/g, communitySectionHtml(guide));
    page = page.replace(/{{CONFIDENCE_USE_CASES_CHIP}}/g, confidenceChipForSection(guide, 'use_cases'));
    page = page.replace(/{{CONFIDENCE_RISK_SCREEN_CHIP}}/g, confidenceChipForSection(guide, 'risk_screen'));
    page = page.replace(/{{CONFIDENCE_DOSING_FRAMEWORK_CHIP}}/g, confidenceChipForSection(guide, 'dosing_framework'));
    page = page.replace(/{{CONFIDENCE_DOSING_PACE_CHIP}}/g, confidenceChipForSection(guide, 'dosing_pace'));
    page = page.replace(/{{CONFIDENCE_DOSING_HOLD_CHIP}}/g, confidenceChipForSection(guide, 'dosing_hold'));
    page = page.replace(/{{CONFIDENCE_DOSING_RESUME_CHIP}}/g, confidenceChipForSection(guide, 'dosing_resume'));
    page = page.replace(/{{CONFIDENCE_DOSING_TRACKING_CHIP}}/g, confidenceChipForSection(guide, 'dosing_tracking'));
    page = page.replace(/{{CONFIDENCE_SOURCES_CHIP}}/g, confidenceChipForSection(guide, 'sources'));
    page = page.replace(/{{CITATIONS_HTML}}/g, citationsHtml);

    fs.writeFileSync(path.join(guidesDir, `${guide.slug}.html`), page);
  }
};

const writeSitemap = () => {
  const staticPaths = [
    '/index.html',
    '/library.html',
    '/support.html',
    '/privacy.html',
    '/terms.html'
  ];

  const staticEntries = staticPaths
    .map((urlPath) => ({ path: urlPath, lastmod: BUILD_DATE }));

  const guideEntries = guides.map((guide) => ({
    path: `/guides/${guide.slug}.html`,
    lastmod: guide.lastReviewed || BUILD_DATE
  }));

  const allEntries = [...staticEntries, ...guideEntries];

  const xmlEntries = allEntries
    .map((entry) => `  <url>\n    <loc>${SITE_URL}${entry.path}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;

  fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
};

const writeRobots = () => {
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  fs.writeFileSync(path.join(root, 'robots.txt'), robots);
};

writeGuidePages();
writeSitemap();
writeRobots();

console.log(`Generated ${guides.length} guide pages.`);
console.log('Generated sitemap.xml and robots.txt.');
