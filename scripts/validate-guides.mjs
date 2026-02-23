#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const guidesPath = path.join(root, 'content', 'guides.json');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CITATION_MARKER_RE = /\[(C\d+)\]/;

const allowedStatus = new Set([
  'approved',
  'experimental',
  'discontinued',
  'nutrient',
  'support',
  'regional-approval'
]);

const allowedClassTags = new Set([
  'Peptide',
  'GLP-1/GIP',
  'Hormone',
  'Injectable Compound',
  'Oral Compound',
  'Vitamin',
  'Mineral',
  'Supportive'
]);

const allowedStatusTags = new Set([
  'Approved',
  'Experimental',
  'Regional Approval',
  'Discontinued',
  'Support/Nutrient'
]);

const allowedRouteTags = new Set(['Injectable', 'Oral', 'Mixed/Unknown']);
const allowedFormatTags = new Set(['Single Compound', 'Blend']);
const allowedVoiceProfiles = new Set(['clinical', 'coach', 'caution', 'support']);
const allowedRegulatoryClassifications = new Set([
  'approved_label',
  'regional_label',
  'off_label_context',
  'investigational',
  'unregulated_market',
  'nutrient_support'
]);
const allowedEvidenceConfidence = new Set(['high', 'moderate', 'low', 'insufficient']);
const requiredEvidenceSections = new Set([
  'use_cases',
  'risk_screen',
  'dosing_framework',
  'dosing_pace',
  'dosing_hold',
  'dosing_resume',
  'dosing_tracking',
  'community_reports',
  'sources'
]);

const DOSAGE_UNIT_RE = /\b(?:\d+(?:\.\d+)?\s*)?(?:mg|mcg|iu|ml|units?)\b/i;
const WEEKLY_X_RE = /\bweekly\s*x\s*\d+/i;
const PRESCRIPTIVE_RE = /\b(?:start at|increase to|take|inject|dose at|titrate to)\b/i;
const SOCIAL_LINK_RE = /\b(?:https?:\/\/\S*(?:reddit\.com|tiktok\.com|x\.com|twitter\.com|discord\.gg)\S*)\b/i;

const bannedPhrases = [
  'appears in the supplier catalog list',
  'documented here for educational orientation',
  'copying vendor-table schedules',
  'commercial listings show multiple strengths and formats'
];

const top50 = new Set([
  'aod-9604', 'b12', 'beinaglutide', 'bpc-157', 'cagrisema', 'cjc-1295', 'cjc-dac', 'danuglipron',
  'dulaglutide', 'ecnoglutide', 'efpeglenatide', 'epithalon', 'exenatide', 'fragment-176-191',
  'ghrp-2', 'ghrp-6', 'glutathione', 'hcg', 'hexarelin', 'insulin', 'ipamorelin', 'l-carnitine',
  'liraglutide', 'lixisenatide', 'mazdutide', 'melanotan-2', 'metformin', 'mic', 'nad-plus',
  'orforglipron', 'pt-141', 'retatrutide', 'selank', 'semaglutide', 'sermorelin', 'survodutide',
  'tb-500', 'tesamorelin', 'tirzepatide', 'vitamin-d3', 'cagrilintide', 'ghk-cu', 'kpv', 'semax',
  'mots-c', 'tesofensine', 'kisspeptin-10', 'gonadorelin',
  'glow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-blend',
  'klow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-plus-kpv-10mg-blend'
]);

const acronymGuides = new Map([
  ['glow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-blend', 'GLOW'],
  ['klow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-plus-kpv-10mg-blend', 'KLOW']
]);

const errors = [];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const guides = readJson(guidesPath);

if (!Array.isArray(guides) || guides.length === 0) {
  errors.push('content/guides.json must be a non-empty array.');
}

const requiredGuideFields = [
  'slug',
  'title',
  'displayTitle',
  'subtitle',
  'aliases',
  'category',
  'status',
  'metaDescription',
  'heroSummary',
  'regulatoryContext',
  'dosingFramework',
  'evidenceProfile',
  'communityReports',
  'riskScreen',
  'useCases',
  'candidateProfile',
  'avoidanceFlags',
  'sideEffects',
  'dosingSection',
  'trackingSignals',
  'safetyFlags',
  'providerQuestions',
  'citations',
  'acronymInfo',
  'composition',
  'taxonomy',
  'voiceProfile',
  'lastReviewed',
  'version'
];

const hasBannedPhrase = (value) => {
  const lower = String(value || '').toLowerCase();
  return bannedPhrases.find((phrase) => lower.includes(phrase));
};

const guideSlugs = new Set();
const heroBySlug = new Map();
const top50Intros = new Map();

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

  if (typeof guide.displayTitle !== 'string' || guide.displayTitle.trim().length === 0) {
    errors.push(`${label} displayTitle must be a non-empty string.`);
  } else {
    if (guide.displayTitle.length > 58) {
      errors.push(`${label} displayTitle is too long (${guide.displayTitle.length} chars).`);
    }

    if (/\b\d+(?:\.\d+)?\s*(mg|mcg|iu|ml|mL)\b/i.test(guide.displayTitle)) {
      errors.push(`${label} displayTitle includes dosage notation and should be cleaned.`);
    }
  }

  if (typeof guide.subtitle !== 'string' || guide.subtitle.trim().length < 12) {
    errors.push(`${label} subtitle must be a readable non-empty sentence.`);
  }

  if (!Array.isArray(guide.aliases)) {
    errors.push(`${label} aliases must be an array.`);
  }

  if (!DATE_RE.test(String(guide.lastReviewed))) {
    errors.push(`${label} lastReviewed must be YYYY-MM-DD.`);
  }

  if (typeof guide.voiceProfile !== 'string' || !allowedVoiceProfiles.has(guide.voiceProfile)) {
    errors.push(`${label} voiceProfile must be one of: ${[...allowedVoiceProfiles].join(', ')}.`);
  }

  if (!guide.acronymInfo || typeof guide.acronymInfo !== 'object') {
    errors.push(`${label} acronymInfo must be an object.`);
  } else {
    if (typeof guide.acronymInfo.isVendorDefined !== 'boolean') {
      errors.push(`${label} acronymInfo.isVendorDefined must be boolean.`);
    }

    const expectedCode = acronymGuides.get(guide.slug);
    if (expectedCode) {
      if (guide.displayTitle !== expectedCode) {
        errors.push(`${label} expected displayTitle to be ${expectedCode}.`);
      }
      if (guide.acronymInfo.code !== expectedCode) {
        errors.push(`${label} acronymInfo.code must be ${expectedCode}.`);
      }
      if (!guide.acronymInfo.isVendorDefined) {
        errors.push(`${label} acronymInfo.isVendorDefined must be true for ${expectedCode}.`);
      }
      if (!guide.acronymInfo.note || !/vendor acronym/i.test(guide.acronymInfo.note)) {
        errors.push(`${label} acronymInfo.note must explain vendor-defined/undisclosed meaning.`);
      }
    }
  }

  if (!Array.isArray(guide.composition)) {
    errors.push(`${label} composition must be an array.`);
  } else {
    for (const [compIndex, part] of guide.composition.entries()) {
      const partLabel = `${label}.composition[${compIndex}]`;
      if (!part || typeof part !== 'object') {
        errors.push(`${partLabel} must be an object.`);
        continue;
      }
      if (!part.name || typeof part.name !== 'string') {
        errors.push(`${partLabel}.name must be a non-empty string.`);
      }
      if (part.amount != null && typeof part.amount !== 'string') {
        errors.push(`${partLabel}.amount must be string or null.`);
      }
    }
  }

  if (!guide.taxonomy || typeof guide.taxonomy !== 'object') {
    errors.push(`${label} taxonomy must be an object.`);
  } else {
    const taxonomy = guide.taxonomy;

    const checks = [
      ['classTags', allowedClassTags],
      ['statusTags', allowedStatusTags],
      ['routeTags', allowedRouteTags],
      ['formatTags', allowedFormatTags]
    ];

    for (const [field, allowed] of checks) {
      if (!Array.isArray(taxonomy[field]) || taxonomy[field].length === 0) {
        errors.push(`${label}.taxonomy.${field} must be a non-empty array.`);
      } else {
        for (const value of taxonomy[field]) {
          if (!allowed.has(value)) {
            errors.push(`${label}.taxonomy.${field} has unsupported value: ${value}`);
          }
        }
      }
    }

    if (typeof taxonomy.isPeptideLike !== 'boolean') {
      errors.push(`${label}.taxonomy.isPeptideLike must be boolean.`);
    }
  }

  if (!guide.regulatoryContext || typeof guide.regulatoryContext !== 'object') {
    errors.push(`${label} regulatoryContext must be an object.`);
  } else {
    if (!allowedRegulatoryClassifications.has(guide.regulatoryContext.classification)) {
      errors.push(`${label}.regulatoryContext.classification is invalid: ${guide.regulatoryContext.classification}`);
    }

    if (typeof guide.regulatoryContext.plainLanguageStatus !== 'string' || guide.regulatoryContext.plainLanguageStatus.trim().length === 0) {
      errors.push(`${label}.regulatoryContext.plainLanguageStatus must be a non-empty string.`);
    }

    if (typeof guide.regulatoryContext.legalNotice !== 'string' || guide.regulatoryContext.legalNotice.trim().length < 20) {
      errors.push(`${label}.regulatoryContext.legalNotice must be a readable sentence.`);
    }
  }

  if (!guide.dosingFramework || typeof guide.dosingFramework !== 'object') {
    errors.push(`${label} dosingFramework must be an object.`);
  } else {
    for (const field of ['pacePrinciples', 'holdTriggers', 'resumeCriteria', 'trackingFocus']) {
      if (!Array.isArray(guide.dosingFramework[field]) || guide.dosingFramework[field].length === 0) {
        errors.push(`${label}.dosingFramework.${field} must be a non-empty array.`);
      }
    }

    if (typeof guide.dosingFramework.uncertaintyStatement !== 'string' || guide.dosingFramework.uncertaintyStatement.trim().length < 20) {
      errors.push(`${label}.dosingFramework.uncertaintyStatement must be a readable sentence.`);
    }
  }

  if (!guide.evidenceProfile || typeof guide.evidenceProfile !== 'object') {
    errors.push(`${label} evidenceProfile must be an object.`);
  } else {
    if (!allowedEvidenceConfidence.has(guide.evidenceProfile.overall)) {
      errors.push(`${label}.evidenceProfile.overall must be one of ${[...allowedEvidenceConfidence].join(', ')}`);
    }

    if (!Array.isArray(guide.evidenceProfile.bySection) || guide.evidenceProfile.bySection.length === 0) {
      errors.push(`${label}.evidenceProfile.bySection must be a non-empty array.`);
    } else {
      const presentSectionKeys = new Set();
      for (const [sectionIndex, entry] of guide.evidenceProfile.bySection.entries()) {
        const sectionLabel = `${label}.evidenceProfile.bySection[${sectionIndex}]`;

        if (!entry || typeof entry !== 'object') {
          errors.push(`${sectionLabel} must be an object.`);
          continue;
        }

        if (typeof entry.sectionKey !== 'string' || entry.sectionKey.trim() === '') {
          errors.push(`${sectionLabel}.sectionKey must be a non-empty string.`);
        } else {
          presentSectionKeys.add(entry.sectionKey);
          if (!requiredEvidenceSections.has(entry.sectionKey)) {
            errors.push(`${sectionLabel}.sectionKey is unsupported: ${entry.sectionKey}`);
          }
        }

        if (!allowedEvidenceConfidence.has(entry.confidence)) {
          errors.push(`${sectionLabel}.confidence must be one of ${[...allowedEvidenceConfidence].join(', ')}`);
        }

        if (typeof entry.rationale !== 'string' || entry.rationale.trim().length < 12) {
          errors.push(`${sectionLabel}.rationale must be a readable sentence.`);
        }

        if (!Array.isArray(entry.citationIds) || entry.citationIds.length === 0) {
          errors.push(`${sectionLabel}.citationIds must be a non-empty array.`);
        }
      }

      for (const requiredKey of requiredEvidenceSections) {
        if (!presentSectionKeys.has(requiredKey)) {
          errors.push(`${label}.evidenceProfile.bySection is missing required sectionKey: ${requiredKey}`);
        }
      }
    }

    if (!Array.isArray(guide.evidenceProfile.dataGaps) || guide.evidenceProfile.dataGaps.length === 0) {
      errors.push(`${label}.evidenceProfile.dataGaps must be a non-empty array.`);
    }
  }

  if (!guide.communityReports || typeof guide.communityReports !== 'object') {
    errors.push(`${label} communityReports must be an object.`);
  } else {
    if (typeof guide.communityReports.included !== 'boolean') {
      errors.push(`${label}.communityReports.included must be boolean.`);
    }

    if (guide.communityReports.confidence !== 'low') {
      errors.push(`${label}.communityReports.confidence must be fixed to "low".`);
    }

    if (!Array.isArray(guide.communityReports.summary)) {
      errors.push(`${label}.communityReports.summary must be an array.`);
    } else if (guide.communityReports.included && guide.communityReports.summary.length === 0) {
      errors.push(`${label}.communityReports.summary must be non-empty when included is true.`);
    }

    if (guide.communityReports.included
      && (typeof guide.communityReports.safetyCaution !== 'string' || guide.communityReports.safetyCaution.trim().length < 20)) {
      errors.push(`${label}.communityReports.safetyCaution must be present when included is true.`);
    }

    if (guide.communityReports.sourcePolicy !== 'summarized_nonlinked') {
      errors.push(`${label}.communityReports.sourcePolicy must be "summarized_nonlinked".`);
    }

    const communityText = [
      ...(guide.communityReports.summary || []),
      guide.communityReports.safetyCaution || ''
    ].join(' ');
    if (SOCIAL_LINK_RE.test(communityText)) {
      errors.push(`${label}.communityReports contains direct social/forum links which are disallowed.`);
    }
  }

  if (!guide.riskScreen || typeof guide.riskScreen !== 'object') {
    errors.push(`${label} riskScreen must be an object.`);
  } else {
    for (const field of ['whoMayDiscussWithProvider', 'whoShouldAvoidOrPause', 'sideEffectsCommon', 'sideEffectsSerious', 'emergencySignals']) {
      if (!Array.isArray(guide.riskScreen[field]) || guide.riskScreen[field].length === 0) {
        errors.push(`${label}.riskScreen.${field} must be a non-empty array.`);
      }
    }
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

    if (!Array.isArray(ds.realWorldPatterns) || ds.realWorldPatterns.length === 0) {
      errors.push(`${label} dosingSection.realWorldPatterns must be a non-empty array.`);
    }

    if (!Array.isArray(ds.escalationBoundaries) || ds.escalationBoundaries.length === 0) {
      errors.push(`${label} dosingSection.escalationBoundaries must be a non-empty array.`);
    }
  }

  for (const listField of ['useCases', 'candidateProfile', 'avoidanceFlags']) {
    if (!Array.isArray(guide[listField]) || guide[listField].length === 0) {
      errors.push(`${label} ${listField} must be a non-empty array.`);
    }
  }

  if (!guide.sideEffects || typeof guide.sideEffects !== 'object') {
    errors.push(`${label} sideEffects must be an object.`);
  } else {
    if (!Array.isArray(guide.sideEffects.common) || guide.sideEffects.common.length === 0) {
      errors.push(`${label} sideEffects.common must be a non-empty array.`);
    }

    if (!Array.isArray(guide.sideEffects.serious) || guide.sideEffects.serious.length === 0) {
      errors.push(`${label} sideEffects.serious must be a non-empty array.`);
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

    const evidenceSections = guide.evidenceProfile?.bySection || [];
    for (const [sectionIndex, section] of evidenceSections.entries()) {
      const sectionLabel = `${label}.evidenceProfile.bySection[${sectionIndex}]`;
      for (const citationId of section.citationIds || []) {
        if (!citationIds.has(citationId)) {
          errors.push(`${sectionLabel} references missing citation id: ${citationId}`);
        }
      }
    }

    const doseStrings = [
      guide?.dosingSection?.overview || '',
      ...(guide?.dosingSection?.protocolPatterns || []),
      ...(guide?.dosingSection?.realWorldPatterns || []),
      ...(guide?.dosingSection?.monitoringWindows || []),
      ...(guide?.dosingSection?.escalationBoundaries || [])
    ];

    const cited = new Set();

    for (const [doseIndex, line] of doseStrings.entries()) {
      if (!/\[C\d+\]/.test(line)) {
        errors.push(`${label} dosing line ${doseIndex + 1} is missing citation marker [C#].`);
      }

      const matches = line.matchAll(/\[(C\d+)\]/g);
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

  if (['low', 'insufficient'].includes(guide.evidenceProfile?.overall)
    && (!guide.dosingFramework?.uncertaintyStatement || guide.dosingFramework.uncertaintyStatement.trim().length < 20)) {
    errors.push(`${label} low/insufficient evidence requires a non-empty dosingFramework.uncertaintyStatement.`);
  }

  if (guide.communityReports?.included
    && (!guide.communityReports.safetyCaution || guide.communityReports.safetyCaution.trim().length < 20)) {
    errors.push(`${label} communityReports.included=true requires safetyCaution.`);
  }

  const legalLintSections = [
    ...(guide.dosingFramework?.pacePrinciples || []),
    ...(guide.dosingFramework?.holdTriggers || []),
    ...(guide.dosingFramework?.resumeCriteria || []),
    ...(guide.dosingFramework?.trackingFocus || []),
    guide.dosingFramework?.uncertaintyStatement || '',
    ...(guide.communityReports?.summary || []),
    guide.communityReports?.safetyCaution || '',
    ...(guide.riskScreen?.whoMayDiscussWithProvider || []),
    ...(guide.riskScreen?.whoShouldAvoidOrPause || []),
    ...(guide.riskScreen?.sideEffectsCommon || []),
    ...(guide.riskScreen?.sideEffectsSerious || []),
    ...(guide.riskScreen?.emergencySignals || [])
  ];

  for (const [lineIndex, line] of legalLintSections.entries()) {
    const text = String(line || '');
    if (DOSAGE_UNIT_RE.test(text) || WEEKLY_X_RE.test(text)) {
      errors.push(`${label} legal lint line ${lineIndex + 1} contains dosage-unit language.`);
    }

    if (PRESCRIPTIVE_RE.test(text)) {
      errors.push(`${label} legal lint line ${lineIndex + 1} contains prescriptive dosing wording.`);
    }
  }

  const textForLint = [
    guide.displayTitle,
    guide.subtitle,
    guide.heroSummary,
    ...(guide.useCases || []),
    ...(guide.candidateProfile || []),
    ...(guide.avoidanceFlags || []),
    ...(guide.sideEffects?.common || []),
    ...(guide.sideEffects?.serious || []),
    ...(guide.riskScreen?.whoMayDiscussWithProvider || []),
    ...(guide.riskScreen?.whoShouldAvoidOrPause || []),
    ...(guide.riskScreen?.sideEffectsCommon || []),
    ...(guide.riskScreen?.sideEffectsSerious || []),
    ...(guide.riskScreen?.emergencySignals || []),
    ...(guide.dosingFramework?.pacePrinciples || []),
    ...(guide.dosingFramework?.holdTriggers || []),
    ...(guide.dosingFramework?.resumeCriteria || []),
    ...(guide.dosingFramework?.trackingFocus || []),
    guide.dosingFramework?.uncertaintyStatement || '',
    ...(guide.communityReports?.summary || []),
    guide.communityReports?.safetyCaution || '',
    guide.dosingSection?.overview,
    ...(guide.dosingSection?.protocolPatterns || []),
    ...(guide.dosingSection?.realWorldPatterns || []),
    ...(guide.dosingSection?.monitoringWindows || []),
    ...(guide.dosingSection?.escalationBoundaries || [])
  ].join(' ');

  const banned = hasBannedPhrase(textForLint);
  if (banned) {
    errors.push(`${label} contains banned boilerplate phrase: "${banned}"`);
  }

  if (typeof guide.heroSummary !== 'string' || guide.heroSummary.trim().length < 40) {
    errors.push(`${label} heroSummary must be at least 40 characters.`);
  } else {
    heroBySlug.set(guide.slug, guide.heroSummary.trim());
  }

  if (top50.has(guide.slug)) {
    const introKey = guide.heroSummary.trim().toLowerCase();
    const existing = top50Intros.get(introKey);
    if (existing && existing !== guide.slug) {
      errors.push(`Top 50 hero intro is duplicated between ${existing} and ${guide.slug}.`);
    }
    top50Intros.set(introKey, guide.slug);
  }
}

for (const slug of top50) {
  if (!guideSlugs.has(slug)) {
    errors.push(`Top 50 target slug missing from guides.json: ${slug}`);
  }
}

if (errors.length > 0) {
  console.error('Validation failed with the following issues:');
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

console.log(`Validation passed: ${guides.length} guides are schema-complete.`);
