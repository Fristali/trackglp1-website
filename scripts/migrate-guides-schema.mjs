#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const guidesPath = path.join(root, 'content', 'guides.json');
const guides = JSON.parse(fs.readFileSync(guidesPath, 'utf8'));

const TOP_50_LIST = [
  'aod-9604', 'b12', 'beinaglutide', 'bpc-157', 'cagrisema', 'cjc-1295', 'cjc-dac', 'danuglipron',
  'dulaglutide', 'ecnoglutide', 'efpeglenatide', 'epithalon', 'exenatide', 'fragment-176-191',
  'ghrp-2', 'ghrp-6', 'glutathione', 'hcg', 'hexarelin', 'insulin', 'ipamorelin', 'l-carnitine',
  'liraglutide', 'lixisenatide', 'mazdutide', 'melanotan-2', 'metformin', 'mic', 'nad-plus',
  'orforglipron', 'pt-141', 'retatrutide', 'selank', 'semaglutide', 'sermorelin', 'survodutide',
  'tb-500', 'tesamorelin', 'tirzepatide', 'vitamin-d3', 'cagrilintide', 'ghk-cu', 'kpv', 'semax',
  'mots-c', 'tesofensine', 'kisspeptin-10', 'gonadorelin',
  'glow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-blend',
  'klow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-plus-kpv-10mg-blend'
];

const TOP_50 = new Set(TOP_50_LIST);

const HANDCRAFTED_TOP50 = {
  'semaglutide': {
    subtitle: 'Weekly GLP-1 anchor protocol with appetite and GI trend tracking.',
    hero: 'Semaglutide works best when the weekly rhythm is boringly consistent. This guide focuses on the real-world cadence: dose day, appetite curve, GI tolerance windows, and clean notes your clinician can act on.'
  },
  'tirzepatide': {
    subtitle: 'Dual GIP/GLP-1 weekly protocol with phase-aware response tracking.',
    hero: 'Tirzepatide has a bigger response range than most people expect. The difference between noise and clarity is how you log week-to-week appetite return, GI tolerance, and energy shifts around each escalation step.'
  },
  'retatrutide': {
    subtitle: 'Investigational triple-agonist context with strict safety framing.',
    hero: 'Retatrutide conversation should start with uncertainty, not hype. Treat it like a high-variance investigational signal: conservative expectations, documented side effects, and zero self-directed escalation.'
  },
  'cagrisema': {
    subtitle: 'Combination pathway guide for layered appetite and tolerance patterns.',
    hero: 'CagriSema is not just Semaglutide plus one more thing. Combination therapies can change both appetite dynamics and side-effect profile, so this guide emphasizes structured comparison across cycles.'
  },
  'dulaglutide': {
    subtitle: 'Long-acting weekly GLP-1 with consistency-first tracking priorities.',
    hero: 'Dulaglutide rewards routine. If your logs keep shifting day-to-day, you lose the trend. This guide helps you keep adherence, GI response, and weight trajectory readable over long windows.'
  },
  'liraglutide': {
    subtitle: 'Daily GLP-1 protocol guide centered on adherence and site rotation.',
    hero: 'Liraglutide is a daily discipline game. The value is in repetition: same timing strategy, clean injection-site rotation, and symptom notes that do not blur into generic felt off entries.'
  },
  'lixisenatide': {
    subtitle: 'Shorter-acting GLP-1 daily guide with meal-timing awareness.',
    hero: 'With lixisenatide, meal timing and symptom timing can overlap fast. This page helps you separate drug effect from meal context so follow-up conversations stay concrete.'
  },
  'exenatide': {
    subtitle: 'Immediate vs extended-release GLP-1 workflow distinctions.',
    hero: 'Exenatide has two very different use patterns. If your notes do not reflect formulation and schedule differences, trend interpretation breaks. This guide keeps those pathways separate and clear.'
  },
  'beinaglutide': {
    subtitle: 'Region-specific GLP-1 context with approval-boundary cautions.',
    hero: 'Beinaglutide sits in a regional context, so good guidance means regulatory clarity first. This page frames what to verify before discussing protocol details.'
  },
  'orforglipron': {
    subtitle: 'Oral investigational incretin profile with cautious expectation setting.',
    hero: 'Orforglipron discussions usually fail when people treat trial headlines like finished clinical guidance. This guide keeps the focus on uncertainty, tolerability, and disciplined monitoring.'
  },
  'danuglipron': {
    subtitle: 'Investigational oral incretin context and adherence framing.',
    hero: 'Danuglipron has generated interest because it is oral, but route convenience does not reduce uncertainty. Log adherence and side effects tightly if it ever enters your care discussions.'
  },
  'ecnoglutide': {
    subtitle: 'Research-stage metabolic peptide with protocol-boundary emphasis.',
    hero: 'Ecnoglutide belongs in a risk-managed conversation, not a shortcut conversation. Keep objective markers and escalation boundaries explicit.'
  },
  'efpeglenatide': {
    subtitle: 'Legacy/discontinued pathway with source-verification focus.',
    hero: 'Efpeglenatide is best handled as a historical or legacy reference. Verify what is current, what is discontinued, and what is still clinically relevant before drawing conclusions.'
  },
  'bpc-157': {
    subtitle: 'Recovery-focused peptide logging with context-rich progress notes.',
    hero: 'BPC-157 notes are only useful when they tie symptoms to location, timeline, and load. Vague better or worse entries hide patterns. This guide pushes objective context over wishful interpretation.'
  },
  'tb-500': {
    subtitle: 'TB-500 recovery-cycle guide with phase-based monitoring.',
    hero: 'TB-500 is often discussed in loading and maintenance phases. If you do not segment your log by phase, you cannot tell what changed or why.'
  },
  'fragment-176-191': {
    subtitle: 'Fat-loss peptide context with strict expectation management.',
    hero: 'Fragment 176-191 is often marketed aggressively. This guide is built to keep claims grounded and to separate tracking evidence from narrative momentum.'
  },
  'aod-9604': {
    subtitle: 'AOD-9604 practical guide for conservative protocol interpretation.',
    hero: 'AOD-9604 conversations can drift into easy cut promises. The better approach is tight logging, stable baseline habits, and honest separation of signal from routine variability.'
  },
  'ipamorelin': {
    subtitle: 'GH secretagogue use-pattern guide with timing discipline.',
    hero: 'Ipamorelin logs get messy when timing floats. This guide centers dosing-window discipline and outcome notes that can survive clinician scrutiny.'
  },
  'cjc-1295': {
    subtitle: 'CJC-1295 non-DAC cadence guide for stack-aware tracking.',
    hero: 'Non-DAC CJC-1295 is timing-sensitive in practice. If you stack it, you need explicit stack metadata in every meaningful note.'
  },
  'cjc-dac': {
    subtitle: 'Longer-acting CJC-DAC overview with cycle-boundary safeguards.',
    hero: 'CJC-DAC discussions should include cycle boundaries up front. Longer-acting compounds demand cleaner stop criteria and clearer reassessment checkpoints.'
  },
  'ghrp-2': {
    subtitle: 'GHRP-2 context with appetite and tolerance monitoring priorities.',
    hero: 'GHRP-2 can shift appetite and stress-response perception quickly. This guide emphasizes structured symptom timing so interpretation stays anchored.'
  },
  'ghrp-6': {
    subtitle: 'GHRP-6 tracking guide with hunger-signal framing.',
    hero: 'GHRP-6 often changes hunger signaling in ways users underestimate. Good logs here are about timing and magnitude, not just yes or no effects.'
  },
  'hexarelin': {
    subtitle: 'Potent secretagogue context with desensitization caution framing.',
    hero: 'Hexarelin gets attention for potency, but that is exactly why the risk conversation matters. This guide favors conservative cycles and clear reassessment points.'
  },
  'sermorelin': {
    subtitle: 'Sermorelin practical tracking guide for nightly protocol routines.',
    hero: 'Sermorelin outcomes are hard to read without consistent nighttime routine context. This page helps keep sleep, timing, and next-day markers aligned.'
  },
  'tesamorelin': {
    subtitle: 'Tesamorelin guide with indication-aware safety boundaries.',
    hero: 'Tesamorelin is one of the few entries here with clearer clinical pathway context. Still, better outcomes come from indication-aware logging and disciplined follow-up.'
  },
  'selank': {
    subtitle: 'Nootropic peptide context with day-function tracking cues.',
    hero: 'Selank logs tend to over-index on subjective mood snapshots. This guide pushes a more useful approach: day-function markers, consistency, and timing clarity.'
  },
  'semax': {
    subtitle: 'Semax cognitive-support tracking guide with structured notes.',
    hero: 'Semax discussions improve when cognitive claims are tied to repeatable tasks and routine windows, not one-off impressions.'
  },
  'mots-c': {
    subtitle: 'MOTS-c metabolic-support context with realistic trend windows.',
    hero: 'MOTS-c is frequently discussed in performance circles. This guide keeps expectations grounded and pushes for trend windows long enough to mean something.'
  },
  'cagrilintide': {
    subtitle: 'Amylin-pathway peptide context with appetite-pattern emphasis.',
    hero: 'Cagrilintide changes appetite patterns in ways that can be subtle at first. Better logs capture timing and meal context, not just total intake.'
  },
  'ghk-cu': {
    subtitle: 'GHK-CU support guide with route and response-context tracking.',
    hero: 'GHK-CU appears in many formulations. The useful work is documenting route, formulation, and response timeline clearly enough to compare cycles.'
  },
  'kpv': {
    subtitle: 'KPV peptide context with symptom-window tracking priorities.',
    hero: 'KPV claims are broad and often loosely defined. This guide keeps your notes actionable by anchoring symptom windows and protocol boundaries.'
  },
  'kisspeptin-10': {
    subtitle: 'Kisspeptin-10 reference guide for hormone-axis discussions.',
    hero: 'Kisspeptin-10 should be treated as endocrine-context sensitive. This page emphasizes clinician-led interpretation and careful biomarker follow-up.'
  },
  'gonadorelin': {
    subtitle: 'Gonadorelin guide with hormone-axis monitoring checkpoints.',
    hero: 'With gonadorelin, context is everything: baseline axis status, intended objective, and lab timing all matter more than anecdote quality.'
  },
  'melanotan-2': {
    subtitle: 'Melanotan II context with side-effect-first logging approach.',
    hero: 'Melanotan II conversations should start with tolerability and risk, not cosmetic outcomes. This guide prioritizes side-effect surveillance and escalation thresholds.'
  },
  'epithalon': {
    subtitle: 'Epithalon anti-aging peptide context with evidence realism.',
    hero: 'Epithalon is often discussed with sweeping longevity claims. This page is intentionally practical: track what can be observed and avoid storytelling leaps.'
  },
  'survodutide': {
    subtitle: 'Investigational metabolic therapy with strong caution posture.',
    hero: 'Survodutide should be handled like a high-uncertainty candidate. The right posture is conservative assumptions, explicit stop rules, and source-backed review.'
  },
  'mazdutide': {
    subtitle: 'Mazdutide investigational profile with careful progression tracking.',
    hero: 'Mazdutide discussions improve when progression is documented in small, interpretable steps rather than broad felt better summaries.'
  },
  'pt-141': {
    subtitle: 'PT-141 on-demand context with timing and response structure.',
    hero: 'PT-141 is typically discussed as-needed, which makes logs messy fast. This guide helps you structure timing, trigger context, and response windows.'
  },
  'hcg': {
    subtitle: 'HCG hormone-support workflow with schedule and lab alignment.',
    hero: 'HCG tracking only becomes useful when dose schedule and lab cadence are aligned. This page keeps those two systems connected so trend review stays meaningful.'
  },
  'insulin': {
    subtitle: 'Insulin high-stakes tracking guide with safety-first guardrails.',
    hero: 'Insulin belongs to a high-consequence category. This guide is built around safety infrastructure: glucose context, hypoglycemia handling, and clinician-directed adjustments.'
  },
  'metformin': {
    subtitle: 'Metformin daily routine guide with meal and GI pattern clarity.',
    hero: 'Metformin is simple to prescribe but easy to log badly. Cleaner meal-context and GI timing notes make dose-tolerance decisions much safer.'
  },
  'l-carnitine': {
    subtitle: 'L-carnitine support guide with route-tolerance focus.',
    hero: 'L-carnitine can look straightforward until route-specific tolerance becomes the limiting factor. This page centers practical logging around that reality.'
  },
  'glutathione': {
    subtitle: 'Glutathione support guide with formulation and handling context.',
    hero: 'Glutathione tracking is most useful when you include formulation, handling, and timing details that usually get skipped in casual notes.'
  },
  'nad-plus': {
    subtitle: 'NAD+ support context with administration-rate awareness.',
    hero: 'NAD+ experiences are highly rate-sensitive for many users. This guide helps you log administration pace and symptom response in a way that supports safer conversations.'
  },
  'mic': {
    subtitle: 'MIC blend workflow guide with composition-aware tracking.',
    hero: 'MIC blends are often treated as generic fat-loss shots. This page keeps the log specific: blend context, schedule, and realistic outcome windows.'
  },
  'vitamin-d3': {
    subtitle: 'Vitamin D3 guide with lab-first supplementation strategy.',
    hero: 'Vitamin D3 looks simple, but good decisions are lab-driven. This guide favors measured recheck intervals over long blind supplementation runs.'
  },
  'b12': {
    subtitle: 'Vitamin B12 support guide with form and symptom-context notes.',
    hero: 'B12 support works best when form, timing, and symptom context are tracked together. This page helps you avoid generic energy felt better logs.'
  },
  'tesofensine': {
    subtitle: 'Tesofensine oral context with appetite and side-effect structure.',
    hero: 'Tesofensine discussions can drift into expectation-heavy narratives. This guide emphasizes appetite, sleep, and tolerability tracking with clean temporal context.'
  },
  'glow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-blend': {
    displayTitle: 'GLOW',
    subtitle: 'GHK-CU + TB-500 + BPC-157 blend.',
    hero: 'GLOW is a vendor-named blend, so clarity comes from component-level tracking. Treat it as three interacting signals, not one monolithic effect.'
  },
  'klow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-plus-kpv-10mg-blend': {
    displayTitle: 'KLOW',
    subtitle: 'GHK-CU + TB-500 + BPC-157 + KPV blend.',
    hero: 'KLOW adds KPV into an already stacked blend, which increases interpretation complexity. This guide prioritizes disciplined logging and conservative conclusions.'
  }
};

const ACRONYM_INFO = {
  'glow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-blend': {
    code: 'GLOW',
    meaning: null,
    isVendorDefined: true,
    note: 'Vendor acronym; full expansion not published in source material.'
  },
  'klow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-plus-kpv-10mg-blend': {
    code: 'KLOW',
    meaning: null,
    isVendorDefined: true,
    note: 'Vendor acronym; full expansion not published in source material.'
  }
};

const MINERAL_SLUGS = new Set([
  'magnesium', 'zinc', 'iron', 'selenium', 'iodine', 'calcium', 'potassium', 'chromium',
  'copper', 'manganese', 'molybdenum', 'phosphorus', 'sodium', 'chloride', 'boron'
]);

const VITAMIN_SLUGS = new Set(['b12', 'vitamin-d3', 'melatonin']);

const GLP_FAMILY_SLUGS = new Set([
  'semaglutide', 'tirzepatide', 'retatrutide', 'cagrisema', 'dulaglutide', 'liraglutide',
  'lixisenatide', 'exenatide', 'beinaglutide', 'orforglipron', 'danuglipron', 'ecnoglutide',
  'efpeglenatide', 'mazdutide', 'survodutide', 'cagrilintide',
  'cagrilintide-5mg-plus-semaglutide-5mg-blend', 'retatrutide-5mg-plus-cagrilintide-5mg-blend'
]);

const ORAL_HINT_SLUGS = new Set([
  'orforglipron', 'danuglipron', 'metformin', 'tesofensine', 'anavar', 'anadrol', 'arimidex',
  'clomid', 'letrozole', 'telmisartan', 'finasteride', 'fluoxymesterone-halotestin',
  'fluoxymesterone', 'dianabol', 'turinabol', 'superdrol', 'sildenafil-viagra', 'tadalafil-cialis',
  'tamoxifen-nolvadex', 'androxal-enclomiphene', 'isotretinoin', 'dutasteride', 'minoxidil'
]);

const HORMONE_HINT_SLUGS = new Set([
  'hcg', 'hmg', 'gonadorelin', 'insulin', 'kisspeptin-10', 'oxytocin-acetate', 't3', 't4'
]);

const PEPTIDE_REGEX = /(peptide|ghrp|cjc|ipamorelin|tesamorelin|sermorelin|tb-?500|bpc|selank|semax|thymosin|thymulin|epithalon|mots-c|ss-31|kisspeptin|kpv|foxo4|dsip|pnc-?27|ll37|adipotide|ara-290|ace-031|melanotan|pt-141|ghk|aod-?9604|fragment-?176-?191|semax|selank|gonadorelin|cagrilintide|retatrutide|survodutide|mazdutide|tirzepatide|semaglutide|dulaglutide|liraglutide|lixisenatide|exenatide|ecnoglutide|efpeglenatide|beinaglutide|hexarelin|epo)/i;

const BANNED_PHRASES = [
  'appears in the supplier catalog list',
  'documented here for educational orientation',
  'copying vendor-table schedules',
  'commercial listings show multiple strengths and formats'
];

const PROFILE_CONFIG = {
  clinical: {
    hero: [
      '{name} becomes easier to evaluate when you keep cadence and symptom notes stable across full review windows.',
      '{name} works best when each change has a reason, a timestamp, and a follow-up checkpoint in your log.',
      '{name} tracking should emphasize repeatability so your clinician can separate trend from noise quickly.'
    ],
    dosing: [
      '{name} should be reviewed over structured intervals, not single difficult days. [C1]',
      'For {name}, protocol moves are safer when escalation is tied to documented tolerance windows. [C1]',
      '{name} decisions should follow objective trend checks, not reactive day-to-day interpretation. [C1]'
    ]
  },
  coach: {
    hero: [
      '{name} is easier to judge when your notes read like a timeline instead of scattered snapshots.',
      'Treat {name} as a consistency challenge: same routine, same markers, fewer assumptions.',
      '{name} tracking improves fast once you define one clear objective and log against it every week.'
    ],
    dosing: [
      'With {name}, consistency beats complexity. Hold one clean routine long enough to produce signal. [C1]',
      '{name} protocols are easier to interpret when you avoid changing multiple variables at once. [C1]',
      'For {name}, stable cadence is the foundation for any useful adjustment discussion. [C1]'
    ]
  },
  caution: {
    hero: [
      '{name} belongs in a conservative conversation where uncertainty is documented, not glossed over.',
      'For {name}, risk control comes from explicit stop criteria and disciplined adverse-effect logging.',
      '{name} should be treated as high-uncertainty: cautious expectations, source-backed decisions, and early escalation of concerns.'
    ],
    dosing: [
      '{name} requires conservative interpretation and explicit stop criteria before any protocol progression. [C1]',
      'For {name}, uncertainty should lead to tighter monitoring, not faster escalation. [C1]',
      '{name} should only be discussed with strong risk framing and clinician-led decision checkpoints. [C1]'
    ]
  },
  support: {
    hero: [
      '{name} looks simple, but better results usually come from routine, timing consistency, and objective follow-up.',
      '{name} tracking is most useful when you link dose timing, tolerance, and symptom context in one log entry.',
      '{name} works best as a steady support protocol with measured check-ins rather than short reactive cycles.'
    ],
    dosing: [
      '{name} should follow a steady cadence with periodic tolerance and response review. [C1]',
      'For {name}, conservative adjustments and measured rechecks are safer than abrupt protocol jumps. [C1]',
      '{name} decisions should be tied to objective follow-up markers whenever possible. [C1]'
    ]
  }
};

const hash = (value) => {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = ((h << 5) - h) + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const pick = (items, key) => items[hash(key) % items.length];

const normalize = (value) => String(value || '').trim();

const tidy = (value) => normalize(value).replace(/\s{2,}/g, ' ');

const toTitleToken = (token) => {
  const clean = token.replace(/[^a-zA-Z0-9+]/g, '');
  if (!clean) return '';
  if (/^\d/.test(clean)) return clean;
  if (clean.length <= 4) return clean.toUpperCase();
  return clean[0].toUpperCase() + clean.slice(1).toLowerCase();
};

const slugToTitle = (slug) => slug
  .split('-')
  .filter(Boolean)
  .map(toTitleToken)
  .join(' ')
  .replace(/\bCu\b/g, 'CU')
  .replace(/\bGhK\b/g, 'GHK')
  .replace(/\bTb\b/g, 'TB')
  .replace(/\bBpc\b/g, 'BPC')
  .replace(/\bNad\b/g, 'NAD');

const hasDoseNotation = (value) => /\b\d+(?:\.\d+)?\s*(?:mg|mcg|iu|ml|mL)\b/i.test(value);

const isLikelyBlend = (guide) => {
  const title = normalize(guide.title);
  return /blend/i.test(title) || /-plus-/.test(guide.slug) || /\bplus\b/i.test(title) || /\s\+\s/.test(title);
};

const COMPONENT_NAME_OVERRIDES = {
  'ghk-cu': 'GHK-CU',
  ghkcu: 'GHK-CU',
  tb500: 'TB-500',
  tb: 'TB-500',
  bpc157: 'BPC-157',
  bpc: 'BPC-157',
  kpv: 'KPV',
  mic: 'MIC',
  nad: 'NAD+',
  ipa: 'Ipamorelin',
  cjc: 'CJC-1295',
  semaglutide: 'Semaglutide',
  cagrilintide: 'Cagrilintide',
  retatrutide: 'Retatrutide',
  tesamorelin: 'Tesamorelin',
  selank: 'Selank',
  semax: 'Semax',
  mots: 'MOTS-c'
};

const COMPOSITION_OVERRIDES = {
  'glow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-blend': [
    { name: 'GHK-CU', amount: '50mg' },
    { name: 'TB-500', amount: '10mg' },
    { name: 'BPC-157', amount: '10mg' }
  ],
  'klow-ghk-cu-50mg-plus-tb500-10mg-plus-bpc157-10mg-plus-kpv-10mg-blend': [
    { name: 'GHK-CU', amount: '50mg' },
    { name: 'TB-500', amount: '10mg' },
    { name: 'BPC-157', amount: '10mg' },
    { name: 'KPV', amount: '10mg' }
  ]
};

const normalizeComponentName = (raw) => {
  const compact = raw.toLowerCase().replace(/[^a-z0-9+-]/g, '');
  if (COMPONENT_NAME_OVERRIDES[compact]) return COMPONENT_NAME_OVERRIDES[compact];
  if (COMPONENT_NAME_OVERRIDES[compact.replace(/\+/g, '')]) {
    return COMPONENT_NAME_OVERRIDES[compact.replace(/\+/g, '')];
  }

  return raw
    .split(/[-\s]+/)
    .filter(Boolean)
    .map(toTitleToken)
    .join(' ')
    .replace(/\bCu\b/g, 'CU')
    .replace(/\bNad\b/g, 'NAD')
    .replace(/\bBpc\b/g, 'BPC')
    .replace(/\bTb\b/g, 'TB')
    .replace(/\bKpv\b/g, 'KPV');
};

const parseComposition = (guide) => {
  if (COMPOSITION_OVERRIDES[guide.slug]) {
    return COMPOSITION_OVERRIDES[guide.slug].map((part) => ({ ...part }));
  }

  if (!isLikelyBlend(guide)) return [];

  const fromSlug = guide.slug.includes('-plus-')
    ? guide.slug.replace(/-blend$/, '').split('-plus-')
    : [];

  const fromTitle = /\s\+\s|\bplus\b/i.test(guide.title)
    ? guide.title
      .replace(/\(.*?\)/g, ' ')
      .replace(/\bblend\b/gi, ' ')
      .split(/\s\+\s|\bplus\b/gi)
      .map((part) => part.trim())
      .filter(Boolean)
    : [];

  const candidateParts = fromSlug.length > 0 ? fromSlug : fromTitle;
  const composition = [];

  for (const part of candidateParts) {
    const source = part.replace(/-blend$/, '').replace(/_/g, '-').trim();
    if (!source) continue;

    const amountSlugMatch = source.match(/(\d+(?:p\d+)?(?:mg|mcg|iu|ml))/i);
    const amountTextMatch = source.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|iu|ml))/i);
    const amount = amountTextMatch ? amountTextMatch[1] : amountSlugMatch ? amountSlugMatch[1].replace('p', '.') : null;

    const nameRaw = source
      .replace(/(\d+(?:p\d+)?(?:mg|mcg|iu|ml))/ig, '')
      .replace(/(\d+(?:\.\d+)?\s*(?:mg|mcg|iu|ml))/ig, '')
      .replace(/\bblend\b/ig, '')
      .replace(/-/g, ' ')
      .trim();

    if (!nameRaw) continue;

    const normalizedName = normalizeComponentName(nameRaw);
    const key = `${normalizedName}|${amount || ''}`;

    if (!composition.some((entry) => `${entry.name}|${entry.amount || ''}` === key)) {
      composition.push({ name: normalizedName, amount });
    }
  }

  return composition;
};

const cleanDisplayTitle = (guide, composition) => {
  if (HANDCRAFTED_TOP50[guide.slug]?.displayTitle) return HANDCRAFTED_TOP50[guide.slug].displayTitle;

  const seeded = normalize(guide.displayTitle);
  if (seeded && !hasDoseNotation(seeded) && seeded.length <= 58) return seeded;

  const title = tidy(guide.title)
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|iu|ml|mL)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (isLikelyBlend(guide) && composition.length > 1) {
    const shortBlend = `${composition.map((c) => c.name).join(' + ')} Blend`;
    if (shortBlend.length <= 58) return shortBlend;

    const trimmedBlend = `${composition[0].name} + ${composition[1].name} Blend`;
    if (trimmedBlend.length <= 58) return trimmedBlend;
  }

  if (title.length > 58 || hasDoseNotation(title)) {
    return slugToTitle(guide.slug);
  }

  return title;
};

const detectTaxonomy = (guide, composition) => {
  const text = [guide.slug, guide.title, guide.category, ...(guide.aliases || [])].join(' ').toLowerCase();
  const category = normalize(guide.category).toLowerCase();

  const isMineral = MINERAL_SLUGS.has(guide.slug) || /\bmineral\b/.test(category);
  const isVitamin = VITAMIN_SLUGS.has(guide.slug) || /\bvitamin\b/.test(category);
  const isGlpFamily = GLP_FAMILY_SLUGS.has(guide.slug)
    || /(glp|gip|incretin)/.test(category)
    || /(semaglutide|tirzepatide|retatrutide|cagrilintide|dulaglutide|liraglutide|lixisenatide|exenatide|orforglipron|danuglipron|mazdutide|survodutide|beinaglutide|ecnoglutide|efpeglenatide|cagrisema)/.test(text);
  const isHormone = HORMONE_HINT_SLUGS.has(guide.slug)
    || /\bhormone\b/.test(category)
    || /(gonadorelin|oxytocin|hcg|hmg|insulin|kisspeptin)/.test(text);

  const isPeptideClass = /\bpeptide\b/.test(category)
    || PEPTIDE_REGEX.test(text)
    || (composition.some((part) => /\b(bpc|tb|ghk|kpv|cjc|ipamorelin|semax|selank|tesamorelin)\b/i.test(part.name)));

  const isOralClass = ORAL_HINT_SLUGS.has(guide.slug)
    || /\boral compound\b/.test(category)
    || /(capsule|tablet|oral)/.test(text)
    || (isGlpFamily && /(orforglipron|danuglipron|metformin)/.test(text));

  const isInjectableClass = /\binjectable compound\b/.test(category)
    || (isPeptideClass && !isOralClass)
    || (isHormone && !isOralClass)
    || (isGlpFamily && !isOralClass)
    || /(inject|vial|suspension)/.test(text);

  const isSupportive = guide.status === 'support'
    || guide.status === 'nutrient'
    || /support|antioxidant|coenzyme|amino acid|weight loss blend/.test(category)
    || isVitamin
    || isMineral;

  const classTags = [];
  if (isPeptideClass) classTags.push('Peptide');
  if (isGlpFamily) classTags.push('GLP-1/GIP');
  if (isHormone) classTags.push('Hormone');
  if (isInjectableClass) classTags.push('Injectable Compound');
  if (isOralClass) classTags.push('Oral Compound');
  if (isVitamin) classTags.push('Vitamin');
  if (isMineral) classTags.push('Mineral');
  if (isSupportive) classTags.push('Supportive');
  if (classTags.length === 0) classTags.push('Supportive');

  let routeTags = ['Mixed/Unknown'];
  if (isInjectableClass && !isOralClass) routeTags = ['Injectable'];
  if (isOralClass && !isInjectableClass) routeTags = ['Oral'];

  const statusMap = {
    approved: 'Approved',
    experimental: 'Experimental',
    'regional-approval': 'Regional Approval',
    discontinued: 'Discontinued',
    support: 'Support/Nutrient',
    nutrient: 'Support/Nutrient'
  };

  const statusTags = [statusMap[guide.status] || 'Support/Nutrient'];

  const formatTags = [isLikelyBlend(guide) || composition.length > 1 ? 'Blend' : 'Single Compound'];

  return {
    classTags: [...new Set(classTags)],
    routeTags,
    statusTags,
    formatTags,
    isPeptideLike: isPeptideClass
  };
};

const determineVoiceProfile = (guide, taxonomy) => {
  if (guide.status === 'experimental' || guide.status === 'discontinued' || guide.status === 'regional-approval') {
    return 'caution';
  }

  if (taxonomy.classTags.includes('GLP-1/GIP') || taxonomy.classTags.includes('Hormone')) {
    return 'clinical';
  }

  if (taxonomy.classTags.includes('Vitamin') || taxonomy.classTags.includes('Mineral') || taxonomy.classTags.includes('Supportive')) {
    return 'support';
  }

  return 'coach';
};

const buildSubtitle = (guide, taxonomy, composition) => {
  if (HANDCRAFTED_TOP50[guide.slug]?.subtitle) return HANDCRAFTED_TOP50[guide.slug].subtitle;

  if (composition.length > 1) {
    return `${composition.map((item) => item.name).join(' + ')} blend with component-aware tracking context.`;
  }

  if (taxonomy.classTags.includes('Peptide')) {
    return 'Peptide guide focused on real-world tracking, risk framing, and clinician-ready notes.';
  }

  if (taxonomy.classTags.includes('GLP-1/GIP')) {
    return 'Metabolic therapy guide centered on cadence, tolerability, and objective trend review.';
  }

  if (taxonomy.classTags.includes('Mineral') || taxonomy.classTags.includes('Vitamin')) {
    return 'Micronutrient guide with lab-aware context and conservative safety boundaries.';
  }

  if (taxonomy.classTags.includes('Oral Compound')) {
    return 'Oral compound guide for adherence quality, side-effect timing, and escalation decisions.';
  }

  return 'Reference guide for structured tracking and safer provider conversations.';
};

const buildHero = (guide, displayTitle, taxonomy, voiceProfile) => {
  if (HANDCRAFTED_TOP50[guide.slug]?.hero) return HANDCRAFTED_TOP50[guide.slug].hero;

  const line = pick(PROFILE_CONFIG[voiceProfile].hero, guide.slug);
  const classHint = taxonomy.classTags.includes('Peptide')
    ? 'Use this page to keep cycle notes specific enough to compare across phases.'
    : taxonomy.classTags.includes('GLP-1/GIP')
      ? 'Use this page to align appetite, GI, and adherence patterns with dose decisions.'
      : taxonomy.classTags.includes('Vitamin') || taxonomy.classTags.includes('Mineral')
        ? 'Use this page to connect symptom notes to lab timing and supplementation cadence.'
        : 'Use this page to keep protocol conversations clear, conservative, and evidence-aware.';

  return `${line.replaceAll('{name}', displayTitle)} ${classHint}`;
};

const buildDosingSection = (guide, displayTitle, taxonomy, voiceProfile) => {
  const overview = pick(PROFILE_CONFIG[voiceProfile].dosing, `${guide.slug}-dosing`)
    .replaceAll('{name}', displayTitle);

  let protocolPatterns = [
    `Set one protocol objective for ${displayTitle} and avoid changing multiple variables in the same week. [C2]`,
    'Write down the reason for every adjustment so retrospective reviews are evidence-based, not memory-based. [C3]'
  ];

  let monitoringWindows = [
    'Track symptom onset, peak, and resolution timing to improve safety signal quality. [C2]',
    'Escalate persistent or severe adverse effects early and document any intervention timing clearly. [C3]'
  ];

  if (taxonomy.classTags.includes('GLP-1/GIP')) {
    protocolPatterns = [
      `Use fixed weekly checkpoints for ${displayTitle} so appetite and GI trends stay comparable across titration steps. [C2]`,
      'Avoid escalation decisions based on one difficult day; use full trend windows before protocol changes. [C3]'
    ];
    monitoringWindows = [
      'Track nausea, satiety, bowel pattern, and hydration in relation to dose day and meal timing. [C2]',
      'Document escalation pauses and symptom recovery before any further dose progression. [C3]'
    ];
  } else if (taxonomy.classTags.includes('Vitamin') || taxonomy.classTags.includes('Mineral')) {
    protocolPatterns = [
      `Keep ${displayTitle} schedule consistent and tie changes to objective follow-up markers when available. [C2]`,
      'Avoid aggressive jumps in intake without clinician guidance, especially when overlapping other supplements. [C3]'
    ];
    monitoringWindows = [
      'Log dose timing, meals, and symptom context so tolerance patterns are interpretable. [C2]',
      'Recheck labs on a planned cadence and document how values map to symptom changes. [C3]'
    ];
  } else if (taxonomy.formatTags.includes('Blend')) {
    protocolPatterns = [
      `Treat ${displayTitle} as a multi-signal protocol and define what each component is expected to influence. [C2]`,
      'Do not add new stacked compounds mid-cycle unless you can isolate effects clearly. [C3]'
    ];
    monitoringWindows = [
      'Log component-related outcomes separately before making blend-level conclusions. [C2]',
      'Escalate unusual reactions quickly since blend attribution is inherently less precise. [C3]'
    ];
  }

  return { overview, protocolPatterns, monitoringWindows };
};

const buildTrackingSignals = (displayTitle, taxonomy) => {
  if (taxonomy.classTags.includes('GLP-1/GIP')) {
    return [
      `Track appetite return, meal size tolerance, and GI patterns around each ${displayTitle} dose window.`,
      'Log dose timing, hydration, and bowel pattern in a consistent format for week-to-week comparison.',
      'Document adherence breaks and restart effects so your clinician can adjust escalation pacing safely.'
    ];
  }

  if (taxonomy.classTags.includes('Peptide')) {
    return [
      `Log ${displayTitle} timing with target-domain notes such as recovery, tissue response, sleep, or mood changes.`,
      'Mark stack composition clearly whenever additional compounds are used in the same cycle.',
      'Use consistent checkpoints so subjective effects are anchored to repeatable observations.'
    ];
  }

  if (taxonomy.classTags.includes('Vitamin') || taxonomy.classTags.includes('Mineral')) {
    return [
      `Track ${displayTitle} timing, meal context, and any tolerance issues in the same daily format.`,
      'Record relevant labs and symptoms side by side so supplementation effects are easier to interpret.',
      'Note changes in other supplements or medications that could confound trend interpretation.'
    ];
  }

  return [
    `Document exact ${displayTitle} timing and whether it was used solo or as part of a broader stack.`,
    'Track target outcomes with date-stamped notes and at least one objective marker where possible.',
    'Log side effects by onset and resolution to improve follow-up decisions.'
  ];
};

const buildSafetyFlags = (displayTitle, taxonomy, status) => {
  const flags = [];

  if (status === 'experimental' || status === 'regional-approval' || status === 'discontinued') {
    flags.push(`${displayTitle} may have incomplete long-term safety evidence; keep expectations conservative.`);
  }

  if (taxonomy.classTags.includes('GLP-1/GIP')) {
    flags.push('Escalating GI symptoms, severe dehydration, or persistent intolerance should trigger rapid clinical review.');
  } else if (taxonomy.classTags.includes('Vitamin') || taxonomy.classTags.includes('Mineral')) {
    flags.push('Excess supplementation can create unintended toxicity or interactions; avoid unsupervised high-dose changes.');
  } else {
    flags.push('Avoid self-directed escalation or high-risk stacking without explicit medical supervision.');
  }

  flags.push('Stop use and seek clinical guidance if unexpected adverse events occur.');

  return flags;
};

const buildProviderQuestions = (displayTitle, taxonomy) => {
  if (taxonomy.classTags.includes('GLP-1/GIP')) {
    return [
      `How should ${displayTitle} titration be paced based on my tolerance history and current goals?`,
      'Which side effects should trigger immediate contact versus routine follow-up?',
      'What objective checkpoints should we use before increasing, holding, or decreasing dose?'
    ];
  }

  if (taxonomy.classTags.includes('Peptide')) {
    return [
      `What is the clinical rationale for ${displayTitle} versus better-established alternatives?`,
      'Which biomarkers or symptom markers should define continuation versus discontinuation?',
      'How should stack complexity be reduced if signal quality is poor or adverse effects appear?'
    ];
  }

  if (taxonomy.classTags.includes('Vitamin') || taxonomy.classTags.includes('Mineral')) {
    return [
      `Do my current labs support using ${displayTitle}, and what target range should we monitor?`,
      'What dosing ceiling should I avoid without additional testing?',
      'How should this fit with my current medications and supplement stack?'
    ];
  }

  return [
    `Is ${displayTitle} appropriate for my goals and risk profile compared with established options?`,
    'Which baseline and follow-up checks should be tracked, and at what cadence?',
    'What adverse-effect thresholds should trigger urgent contact?' 
  ];
};

const removeBannedPhrases = (value) => {
  let text = normalize(value);
  for (const phrase of BANNED_PHRASES) {
    text = text.replace(new RegExp(phrase, 'ig'), 'is included here as an educational reference');
  }
  return tidy(text);
};

const ensureCitationMarker = (value, marker) => {
  if (/\[C\d+\]/.test(value)) return value;
  return `${tidy(value)} ${marker}`.trim();
};

const handcraftedMissing = TOP_50_LIST.filter((slug) => !HANDCRAFTED_TOP50[slug]);
if (handcraftedMissing.length > 0) {
  console.error('Top 50 handcrafted map is incomplete:');
  for (const slug of handcraftedMissing) {
    console.error(`- ${slug}`);
  }
  process.exit(1);
}

for (const guide of guides) {
  const composition = parseComposition(guide);
  const displayTitle = cleanDisplayTitle(guide, composition);
  const taxonomy = detectTaxonomy(guide, composition);
  const voiceProfile = determineVoiceProfile(guide, taxonomy);

  const acronymInfo = ACRONYM_INFO[guide.slug]
    ? { ...ACRONYM_INFO[guide.slug] }
    : { code: null, meaning: null, isVendorDefined: false, note: null };

  const subtitle = buildSubtitle(guide, taxonomy, composition);
  const heroSummary = buildHero(guide, displayTitle, taxonomy, voiceProfile);
  const dosingSection = buildDosingSection(guide, displayTitle, taxonomy, voiceProfile);
  const trackingSignals = buildTrackingSignals(displayTitle, taxonomy);
  const safetyFlags = buildSafetyFlags(displayTitle, taxonomy, guide.status);
  const providerQuestions = buildProviderQuestions(displayTitle, taxonomy);

  guide.displayTitle = displayTitle;
  guide.subtitle = removeBannedPhrases(subtitle);
  guide.acronymInfo = acronymInfo;
  guide.composition = composition;
  guide.taxonomy = taxonomy;
  guide.voiceProfile = voiceProfile;

  guide.heroSummary = removeBannedPhrases(heroSummary);

  guide.dosingSection = {
    overview: ensureCitationMarker(removeBannedPhrases(dosingSection.overview), '[C1]'),
    protocolPatterns: dosingSection.protocolPatterns.map((line, index) => {
      const marker = index === 0 ? '[C2]' : '[C3]';
      return ensureCitationMarker(removeBannedPhrases(line), marker);
    }),
    monitoringWindows: dosingSection.monitoringWindows.map((line, index) => {
      const marker = index === 0 ? '[C2]' : '[C3]';
      return ensureCitationMarker(removeBannedPhrases(line), marker);
    })
  };

  guide.trackingSignals = trackingSignals.map(removeBannedPhrases);
  guide.safetyFlags = safetyFlags.map(removeBannedPhrases);
  guide.providerQuestions = providerQuestions.map(removeBannedPhrases);

  const oldTitle = normalize(guide.title);
  if (displayTitle !== oldTitle && oldTitle.length > 0) {
    const aliases = Array.isArray(guide.aliases) ? [...guide.aliases] : [];
    if (!aliases.includes(oldTitle)) aliases.push(oldTitle);
    guide.aliases = aliases;
  }
}

guides.sort((a, b) => a.slug.localeCompare(b.slug));
fs.writeFileSync(guidesPath, `${JSON.stringify(guides, null, 2)}\n`);

console.log(`Migrated ${guides.length} guides to enhanced schema fields and editorial voice profiles.`);
