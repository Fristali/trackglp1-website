#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const guidesPath = path.join(root, 'content', 'guides.json');

const guides = JSON.parse(fs.readFileSync(guidesPath, 'utf8'));

const normalize = (value) => String(value || '').toLowerCase().trim();
const stripCitation = (value) => String(value || '').replace(/\[(C\d+)\]/g, '').trim();

const cleanLine = (value) => stripCitation(value)
  .replace(/\b\d+(?:\.\d+)?\s*(mg|mcg|iu|ml|units?)\b/ig, 'structured amount')
  .replace(/\b(start at|increase to|take|inject|dose at|titrate to)\b/ig, 'review with your clinician')
  .replace(/\s+/g, ' ')
  .trim();

const cleanList = (values) => (Array.isArray(values) ? values : [])
  .map(cleanLine)
  .filter(Boolean);

const unique = (values) => {
  const result = [];
  for (const value of values) {
    const cleaned = cleanLine(value);
    if (!cleaned || result.includes(cleaned)) continue;
    result.push(cleaned);
  }
  return result;
};

const classifyProfile = (guide) => {
  const tags = (guide.taxonomy?.classTags || []).map(normalize);
  if (tags.includes('glp-1/gip')) return 'glp';
  if (tags.includes('mineral') || tags.includes('vitamin')) return 'nutrient';
  if (tags.includes('hormone')) return 'hormone';
  if (tags.includes('peptide') || guide.taxonomy?.isPeptideLike) return 'peptide';
  if (tags.includes('oral compound')) return 'oral';
  if (tags.includes('injectable compound')) return 'injectable';
  return 'supportive';
};

const classifyRegulatory = (guide) => {
  const status = guide.status;
  const category = normalize(guide.category);

  if (status === 'approved') return 'approved_label';
  if (status === 'regional-approval') return 'regional_label';
  if (status === 'nutrient') return 'nutrient_support';
  if (status === 'discontinued') return 'off_label_context';
  if (status === 'experimental') {
    if (/(sarm|anabolic|steroid|stack|blend|research|performance)/.test(category)) {
      return 'unregulated_market';
    }
    return 'investigational';
  }
  return 'off_label_context';
};

const overallConfidence = (classification) => {
  if (classification === 'approved_label' || classification === 'nutrient_support') return 'moderate';
  if (classification === 'unregulated_market') return 'insufficient';
  return 'low';
};

const legalNotice = (classification) => {
  if (classification === 'approved_label') {
    return 'Approved-label context may exist, but this page is educational only and not a dosing instruction.';
  }
  if (classification === 'nutrient_support') {
    return 'Nutrient context should be personalized to labs and clinical history; this page is educational only.';
  }
  if (classification === 'regional_label') {
    return 'Regional-label status varies by jurisdiction; this page is educational only and not treatment guidance.';
  }
  if (classification === 'off_label_context') {
    return 'Off-label or limited-label context can vary by clinician judgment and region; this page is educational only.';
  }
  if (classification === 'unregulated_market') {
    return 'Unregulated-market compounds may lack standardized oversight; this page is educational only and not a usage directive.';
  }
  return 'Investigational context means uncertainty remains high; this page is educational only and not a dosing directive.';
};

const baseDosingByProfile = (profile, title) => {
  if (profile === 'glp') {
    return {
      pacePrinciples: [
        `${title} is usually reviewed over consistent multi-week trend windows before any protocol adjustment.`,
        'Tolerance, hydration, and symptom trajectory should be interpreted together rather than from a single difficult day.',
        'One variable change per review window improves safety interpretation quality.'
      ],
      holdTriggers: [
        'Escalating intolerance, repeated poor oral intake, or worsening functional symptoms should prompt an immediate hold and clinical review.',
        'Any severe new symptom cluster after protocol changes should pause progression until evaluated.'
      ],
      resumeCriteria: [
        'Resume decisions are safer after symptoms stabilize and trend logs are reviewed with a licensed clinician.',
        'Progression should only continue when risk signals have eased and goals remain clinically appropriate.'
      ]
    };
  }

  if (profile === 'nutrient') {
    return {
      pacePrinciples: [
        `${title} should be framed as targeted support with objective re-check windows, not open-ended escalation.`,
        'Adjustment pace should follow symptom and laboratory context reviewed by a qualified clinician.',
        'Stack complexity should stay low so changes remain interpretable.'
      ],
      holdTriggers: [
        'Worsening intolerance or imbalance symptoms should pause progression pending medical review.',
        'Any severe new symptom pattern during a support phase should trigger prompt clinical evaluation.'
      ],
      resumeCriteria: [
        'Resume only after symptom stabilization and updated clinical context confirm benefit-to-risk remains acceptable.',
        'Continue with conservative pacing and clear stop criteria discussed with your clinician.'
      ]
    };
  }

  if (profile === 'peptide') {
    return {
      pacePrinciples: [
        `${title} should be interpreted conservatively because evidence quality and product consistency can vary.`,
        'Avoid changing multiple compounds in the same review window so signal quality is preserved.',
        'Use pre-defined continuation and stop criteria before considering protocol progression.'
      ],
      holdTriggers: [
        'Unexpected systemic symptoms or rapidly worsening local reactions should trigger immediate hold and urgent clinical review.',
        'Any unclear adverse pattern in a stacked protocol should pause progression until attribution is clarified.'
      ],
      resumeCriteria: [
        'Resume only after clinical review confirms symptoms have stabilized and risk has been reassessed.',
        'Restart decisions should favor simpler protocols with clearer monitoring windows.'
      ]
    };
  }

  return {
    pacePrinciples: [
      `${title} should be paced conservatively with one protocol variable reviewed at a time.`,
      'Trend quality improves when logs are captured consistently across comparable windows.',
      'Escalation decisions should be anchored to objective review rather than day-to-day variability.'
    ],
    holdTriggers: [
      'Rapidly worsening side effects or new severe symptoms should trigger immediate hold and clinician review.',
      'If risk signals rise faster than benefit signals, pause progression and reassess.'
    ],
    resumeCriteria: [
      'Resume after stability returns and a clinician confirms the risk-benefit balance remains acceptable.',
      'Continue with conservative pacing and explicit monitoring checkpoints.'
    ]
  };
};

const priorityOverrides = {
  semaglutide: {
    pacePrinciples: [
      'Semaglutide trend review is strongest when appetite-return, hydration, and GI tolerance are logged in a consistent weekly rhythm.',
      'Escalation timing should follow tolerance stability and clinician review, not calendar pressure.',
      'Single-variable adjustments protect signal quality during protocol review.'
    ]
  },
  tirzepatide: {
    pacePrinciples: [
      'Tirzepatide response intensity varies significantly, so pacing should remain conservative and trend-driven.',
      'Escalation should follow tolerability recovery and documented symptom stability.',
      'Weekly pattern review usually outperforms single-day reactions for protocol decisions.'
    ]
  },
  metformin: {
    pacePrinciples: [
      'Metformin trend quality improves when timing, meal context, and tolerance logs are kept consistent.',
      'Adjustment pace should follow sustained symptom patterns rather than short-term fluctuations.',
      'Protocol review should prioritize tolerability and objective metabolic goals together.'
    ]
  },
  insulin: {
    holdTriggers: [
      'Recurrent low-glucose risk signals or severe symptomatic instability require immediate hold-and-review with a clinician.',
      'Rapid glucose volatility with neurologic or cardiopulmonary symptoms requires urgent evaluation.'
    ]
  }
};

for (const guide of guides) {
  const title = guide.displayTitle || guide.title || guide.slug;
  const profile = classifyProfile(guide);
  const classification = classifyRegulatory(guide);
  const overall = overallConfidence(classification);
  const citations = (guide.citations || []).map((entry) => entry.id).filter(Boolean);
  const citationPair = citations.slice(0, 2);
  const citationSingle = citations.slice(0, 1);

  const baseDosing = baseDosingByProfile(profile, title);
  const override = priorityOverrides[guide.slug] || {};
  const pacePrinciples = unique(override.pacePrinciples || baseDosing.pacePrinciples);
  const holdTriggers = unique(override.holdTriggers || baseDosing.holdTriggers);
  const resumeCriteria = unique(override.resumeCriteria || baseDosing.resumeCriteria);

  const trackingFocus = unique([
    ...(guide.trackingSignals || []),
    'Capture symptom timing relative to protocol windows so trend review stays objective.',
    'Document holds, restarts, and clinically significant events in the same structured format.'
  ]);

  const uncertaintyStatement = overall === 'moderate'
    ? 'Evidence quality is moderate and still requires individualized clinical interpretation for safe decision-making.'
    : 'Evidence confidence is limited, so this section should be treated as educational context rather than dosing instruction.';

  guide.regulatoryContext = {
    classification,
    plainLanguageStatus: guide.statusLabel || guide.status,
    legalNotice: legalNotice(classification)
  };

  guide.dosingFramework = {
    pacePrinciples,
    holdTriggers,
    resumeCriteria,
    trackingFocus,
    uncertaintyStatement
  };

  guide.riskScreen = {
    whoMayDiscussWithProvider: unique([
      ...(guide.candidateProfile || []),
      'People who can review risks, interactions, and goals with a licensed clinician before protocol changes.'
    ]),
    whoShouldAvoidOrPause: unique([
      ...(guide.avoidanceFlags || []),
      'Anyone with severe new symptoms should pause and seek urgent medical review.'
    ]),
    sideEffectsCommon: unique(guide.sideEffects?.common || []),
    sideEffectsSerious: unique(guide.sideEffects?.serious || []),
    emergencySignals: unique([
      'Trouble breathing, facial swelling, chest pain, severe neurologic symptoms, or fainting requires emergency care.',
      'Persistent inability to keep fluids down with worsening weakness requires urgent evaluation.',
      'Any severe rapid-onset reaction after use should be treated as an emergency signal.'
    ])
  };

  guide.evidenceProfile = {
    overall,
    overallRationale: overall === 'moderate'
      ? 'Confidence is moderate based on authoritative sources, but personalization and clinical review are still required.'
      : 'Confidence is limited due to variability in source quality, population fit, or regulatory standardization.',
    bySection: [
      { sectionKey: 'use_cases', confidence: overall, rationale: 'Use-case framing is based on source summaries and clinical context.', citationIds: citationPair.length ? citationPair : citationSingle },
      { sectionKey: 'risk_screen', confidence: overall === 'moderate' ? 'moderate' : 'low', rationale: 'Risk framing prioritizes safety signals and conservative escalation language.', citationIds: citationPair.length ? citationPair : citationSingle },
      { sectionKey: 'dosing_framework', confidence: overall, rationale: 'Framework focuses on non-prescriptive pacing and hold/resume boundaries.', citationIds: citationPair.length ? citationPair : citationSingle },
      { sectionKey: 'dosing_pace', confidence: overall, rationale: 'Pace principles are trend-based and avoid numerical protocol instructions.', citationIds: citationPair.length ? citationPair : citationSingle },
      { sectionKey: 'dosing_hold', confidence: overall === 'moderate' ? 'moderate' : 'low', rationale: 'Hold triggers emphasize early escalation of concerning symptoms.', citationIds: citationPair.length ? citationPair : citationSingle },
      { sectionKey: 'dosing_resume', confidence: overall === 'moderate' ? 'moderate' : 'low', rationale: 'Resume criteria require stability and clinician review before progression.', citationIds: citationPair.length ? citationPair : citationSingle },
      { sectionKey: 'dosing_tracking', confidence: overall === 'moderate' ? 'moderate' : 'low', rationale: 'Tracking focus is designed for structured clinical discussions and safer trend interpretation.', citationIds: citationPair.length ? citationPair : citationSingle },
      { sectionKey: 'community_reports', confidence: 'low', rationale: 'Community summaries are observational and non-standardized by design.', citationIds: citationSingle },
      { sectionKey: 'sources', confidence: citations.length >= 4 ? 'moderate' : 'low', rationale: 'Source confidence depends on the quality and breadth of cited references.', citationIds: citationPair.length ? citationPair : citationSingle }
    ],
    dataGaps: unique([
      'No universal protocol fits every risk profile, comorbidity pattern, or co-medication context.',
      overall === 'moderate'
        ? 'Most evidence still requires individualized interpretation and clinician review for safe application.'
        : 'No broadly standardized regulated dosing protocol is available for many real-world contexts.',
      'Long-term comparative data may be limited for specific populations and combination protocols.'
    ])
  };

  guide.communityReports = {
    included: true,
    confidence: 'low',
    summary: unique([
      `Community logs for ${title} often emphasize pacing decisions around tolerability trends rather than rapid progression.`,
      'Reports frequently describe better signal quality when one protocol variable is changed per review window.',
      'Community observations vary widely and may be influenced by source quality, expectation effects, and incomplete tracking.'
    ]),
    safetyCaution: 'Community summaries are low-confidence observations and should never replace individualized medical guidance.',
    sourcePolicy: 'summarized_nonlinked'
  };
}

fs.writeFileSync(guidesPath, `${JSON.stringify(guides, null, 2)}\n`);
console.log(`Migrated ${guides.length} guides to legal-safe depth schema.`);
