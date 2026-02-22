#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const guidesPath = path.join(root, 'content', 'guides.json');
const updatesPath = path.join(root, 'content', 'updates.json');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CITATION_MARKER_RE = /\[(C\d+)\]/g;

const allowedStatus = new Set([
  'approved',
  'experimental',
  'discontinued',
  'nutrient',
  'support',
  'regional-approval'
]);

const errors = [];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const guides = readJson(guidesPath);
const updates = readJson(updatesPath);

if (!Array.isArray(guides) || guides.length === 0) {
  errors.push('content/guides.json must be a non-empty array.');
}

if (!Array.isArray(updates) || updates.length === 0) {
  errors.push('content/updates.json must be a non-empty array.');
}

const requiredGuideFields = [
  'slug',
  'title',
  'aliases',
  'category',
  'status',
  'metaDescription',
  'heroSummary',
  'dosingSection',
  'trackingSignals',
  'safetyFlags',
  'providerQuestions',
  'citations',
  'lastReviewed',
  'version'
];

const guideSlugs = new Set();

for (const [index, guide] of guides.entries()) {
  const label = `guide[${index}]`;

  for (const field of requiredGuideFields) {
    if (!(field in guide)) {
      errors.push(`${label} missing required field: ${field}`);
    }
  }

  if (!guide.slug || !SLUG_RE.test(guide.slug)) {
    errors.push(`${label} has invalid slug: ${guide.slug}`);
  } else if (guideSlugs.has(guide.slug)) {
    errors.push(`${label} has duplicate slug: ${guide.slug}`);
  } else {
    guideSlugs.add(guide.slug);
  }

  if (!allowedStatus.has(guide.status)) {
    errors.push(`${label} has unsupported status: ${guide.status}`);
  }

  if (!Array.isArray(guide.aliases)) {
    errors.push(`${label} aliases must be an array.`);
  }

  if (!DATE_RE.test(String(guide.lastReviewed))) {
    errors.push(`${label} lastReviewed must be YYYY-MM-DD.`);
  }

  if (!guide.dosingSection || typeof guide.dosingSection !== 'object') {
    errors.push(`${label} dosingSection must be an object.`);
  } else {
    const ds = guide.dosingSection;
    if (typeof ds.overview !== 'string' || ds.overview.trim().length === 0) {
      errors.push(`${label} dosingSection.overview must be a non-empty string.`);
    }

    if (!Array.isArray(ds.protocolPatterns) || ds.protocolPatterns.length === 0) {
      errors.push(`${label} dosingSection.protocolPatterns must be a non-empty array.`);
    }

    if (!Array.isArray(ds.monitoringWindows) || ds.monitoringWindows.length === 0) {
      errors.push(`${label} dosingSection.monitoringWindows must be a non-empty array.`);
    }
  }

  for (const listField of ['trackingSignals', 'safetyFlags', 'providerQuestions']) {
    if (!Array.isArray(guide[listField]) || guide[listField].length === 0) {
      errors.push(`${label} ${listField} must be a non-empty array.`);
    }
  }

  if (!Array.isArray(guide.citations) || guide.citations.length === 0) {
    errors.push(`${label} citations must be a non-empty array.`);
  }

  const citationIds = new Set();
  if (Array.isArray(guide.citations)) {
    for (const [citationIndex, citation] of guide.citations.entries()) {
      const citationLabel = `${label}.citations[${citationIndex}]`;
      for (const field of ['id', 'title', 'url', 'sourceType', 'publisher', 'publishedDate', 'accessedDate']) {
        if (!citation[field]) {
          errors.push(`${citationLabel} missing field: ${field}`);
        }
      }

      if (citation.id) {
        if (citationIds.has(citation.id)) {
          errors.push(`${label} has duplicate citation id: ${citation.id}`);
        }
        citationIds.add(citation.id);
      }

      if (citation.url && !/^https?:\/\//.test(citation.url)) {
        errors.push(`${citationLabel} url must be absolute http(s): ${citation.url}`);
      }

      if (citation.publishedDate && !DATE_RE.test(citation.publishedDate)) {
        errors.push(`${citationLabel} publishedDate must be YYYY-MM-DD.`);
      }

      if (citation.accessedDate && !DATE_RE.test(citation.accessedDate)) {
        errors.push(`${citationLabel} accessedDate must be YYYY-MM-DD.`);
      }
    }

    const doseStrings = [
      guide?.dosingSection?.overview || '',
      ...(guide?.dosingSection?.protocolPatterns || []),
      ...(guide?.dosingSection?.monitoringWindows || [])
    ];

    const cited = new Set();

    for (const [doseIndex, line] of doseStrings.entries()) {
      if (!/\[C\d+\]/.test(line)) {
        errors.push(`${label} dosing line ${doseIndex + 1} is missing citation marker [C#].`);
      }

      const matches = line.matchAll(CITATION_MARKER_RE);
      for (const match of matches) {
        cited.add(match[1]);
      }
    }

    if (cited.size === 0) {
      errors.push(`${label} has no citation markers in dosingSection.`);
    }

    for (const marker of cited) {
      if (!citationIds.has(marker)) {
        errors.push(`${label} references ${marker} but no matching citation exists.`);
      }
    }
  }
}

const updateIds = new Set();
for (const [index, entry] of updates.entries()) {
  const label = `update[${index}]`;
  for (const field of ['id', 'date', 'title', 'summary', 'impactedGuides', 'version']) {
    if (!(field in entry)) {
      errors.push(`${label} missing required field: ${field}`);
    }
  }

  if (entry.id && updateIds.has(entry.id)) {
    errors.push(`${label} duplicate update id: ${entry.id}`);
  }
  updateIds.add(entry.id);

  if (entry.date && !DATE_RE.test(entry.date)) {
    errors.push(`${label} date must be YYYY-MM-DD.`);
  }

  if (!Array.isArray(entry.impactedGuides) || entry.impactedGuides.length === 0) {
    errors.push(`${label} impactedGuides must be a non-empty array.`);
  } else {
    for (const slug of entry.impactedGuides) {
      if (!guideSlugs.has(slug)) {
        errors.push(`${label} references unknown guide slug: ${slug}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Validation failed with the following issues:');
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

console.log(`Validation passed: ${guides.length} guides and ${updates.length} updates are schema-complete.`);
