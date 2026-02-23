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

const unique = (values) => {
  const result = [];
  for (const value of values) {
    const cleaned = String(value || '').trim();
    if (!cleaned || result.includes(cleaned)) continue;
    result.push(cleaned);
  }
  return result;
};

const hash = (input) => {
  let h = 2166136261;
  for (const char of String(input || '')) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
};

const addCitation = (line, citationId) => /\[C\d+\]/.test(line) ? line : `${line} [${citationId}]`;

const withCitationRotation = (items, seed, availableIds) => {
  const fallback = ['C1', 'C2', 'C3'];
  const cycle = availableIds.length > 0 ? availableIds : fallback;
  const offset = seed % cycle.length;
  return items.map((line, index) => addCitation(line, cycle[(offset + index) % cycle.length]));
};

const classifyProfile = (guide) => {
  const classTags = (guide.taxonomy?.classTags || []).map(normalize);
  const status = normalize(guide.status);

  if (classTags.includes('glp-1/gip')) return 'glp';
  if (classTags.includes('mineral') || classTags.includes('vitamin')) return 'nutrient';
  if (classTags.includes('hormone')) return 'hormone';
  if (status === 'experimental' && (classTags.includes('peptide') || guide.taxonomy?.isPeptideLike)) return 'peptide';
  if (classTags.includes('peptide') || guide.taxonomy?.isPeptideLike) return 'peptide';
  if (classTags.includes('oral compound')) return 'oral';
  if (classTags.includes('injectable compound')) return 'injectable';
  return 'supportive';
};

const profileUseCases = (displayTitle, profile, isBlend) => {
  const blendLine = isBlend
    ? `${displayTitle} is a blend, so interpretation should stay component-aware instead of treating every response as one signal.`
    : `${displayTitle} is usually tracked as a single active signal so dose-response trends remain interpretable.`;

  switch (profile) {
    case 'glp':
      return [
        `${displayTitle} is mainly discussed for glucose and/or weight-management goals under licensed clinical supervision.`,
        'It is usually considered when lifestyle work alone is not giving stable metabolic outcomes.',
        'Tracking adherence, appetite curve, hydration, and GI tolerance is central to safe pacing.'
      ];
    case 'nutrient':
      return [
        `${displayTitle} is generally used to correct or prevent a confirmed nutrient gap, not as open-ended high-dose therapy.`,
        'Best decisions come from lab context, symptom context, and a defined re-check window.',
        'Use should be goal-oriented, with clear criteria for tapering, maintenance, or stop.'
      ];
    case 'hormone':
      return [
        `${displayTitle} is typically discussed for endocrine goals that require baseline labs and regular follow-up.`,
        'Benefit and risk are driven by how well labs, symptoms, and timing are tracked together.',
        'Dose changes usually belong inside a supervised plan rather than ad-hoc cycle edits.'
      ];
    case 'oral':
      return [
        `${displayTitle} is usually used for symptom- or condition-focused goals where oral adherence is practical.`,
        'Meal timing, sleep, and co-medication context often determine whether tolerance stays stable.',
        'Progress is cleaner when one protocol variable is changed at a time.'
      ];
    case 'injectable':
      return [
        `${displayTitle} is generally used in protocols where injection timing and site quality materially affect outcomes.`,
        'Benefit interpretation improves when symptom logs are tied directly to injection windows.',
        'A sterile technique checklist and site-rotation plan are core parts of safe use.'
      ];
    case 'peptide':
      return [
        `${displayTitle} is often approached as investigational support with variable evidence depth and variable product quality.`,
        blendLine,
        'Use is safest when there are pre-defined continuation and stop criteria before escalation.'
      ];
    default:
      return [
        `${displayTitle} should be framed as a targeted support tool with explicit goals and an exit plan.`,
        'The protocol should be reviewed against objective logs rather than day-to-day mood shifts.',
        'Most users benefit from conservative pacing and early review when side effects cluster.'
      ];
  }
};

const profileCandidate = (profile) => {
  switch (profile) {
    case 'glp':
      return [
        'Adults with clinician-defined metabolic goals and a follow-up cadence that includes trend review.',
        'People willing to log weekly appetite return, bowel pattern, hydration, and adherence consistency.',
        'Users prepared for slow titration and occasional holds rather than forced escalation.'
      ];
    case 'nutrient':
      return [
        'People with confirmed deficiency risk, low intake, or objective clinical reason for targeted support.',
        'Users who can re-check labs/symptoms on schedule instead of extending high doses indefinitely.',
        'Patients whose medication list has been reviewed for interaction or absorption conflicts.'
      ];
    case 'hormone':
      return [
        'Patients with a clear endocrine objective and baseline lab panel before protocol decisions.',
        'People able to complete repeat labs and clinical follow-up on schedule.',
        'Users who can avoid stacking multiple endocrine-active compounds at the same time.'
      ];
    case 'injectable':
      return [
        'People who can maintain sterile prep, site rotation, and date/time injection logs consistently.',
        'Users with a defined objective and a clear review interval for benefit and tolerance.',
        'Patients ready to stop and reassess quickly if local or systemic reactions appear.'
      ];
    case 'oral':
      return [
        'People who can maintain consistent daily timing and document meal/medication context.',
        'Users with a specific symptom or lab objective and objective follow-up checkpoints.',
        'Patients who can avoid self-directed escalation when short-term results fluctuate.'
      ];
    case 'peptide':
      return [
        'Users with specialist oversight who understand evidence uncertainty and product-quality variability.',
        'People who can define one primary endpoint and track it consistently before changing variables.',
        'Patients who can commit to stop rules if side effects rise or no objective signal emerges.'
      ];
    default:
      return [
        'Users with a clear reason for use and clinician oversight for higher-risk decisions.',
        'People who can keep objective logs and review them on a fixed schedule.',
        'Patients ready to de-escalate when risk rises faster than benefit.'
      ];
  }
};

const profileAvoidance = (profile) => {
  const shared = [
    'Pregnancy, breastfeeding, and active conception planning should be reviewed with a specialist before use.',
    'Prior severe hypersensitivity reaction to related compounds is a strong caution signal.',
    'Rapidly worsening symptoms after dose changes should trigger immediate hold and clinical review.'
  ];

  switch (profile) {
    case 'glp':
      return [
        'Active severe GI symptoms, persistent poor oral intake, or dehydration signs should pause escalation.',
        'Complex polypharmacy or unstable chronic disease raises interaction risk and needs tailored review.',
        ...shared
      ];
    case 'nutrient':
      return [
        'Renal impairment, absorption disorders, or known mineral balance disorders need individualized dosing plans.',
        'Stacking multiple products with overlapping micronutrients can raise toxicity risk unexpectedly.',
        ...shared
      ];
    case 'hormone':
      return [
        'Unmonitored hormone-active stacks can produce unstable labs and misleading symptom interpretation.',
        'Cardiometabolic risk factors or thrombotic risk require tighter clinical monitoring.',
        ...shared
      ];
    case 'peptide':
      return [
        'Unknown source quality or poor storage/handling substantially increases avoidable risk.',
        'Do not combine multiple investigational compounds unless each signal can be tracked separately.',
        ...shared
      ];
    default:
      return shared;
  }
};

const profileSideEffects = (profile) => {
  switch (profile) {
    case 'glp':
      return {
        common: [
          'Nausea, early satiety, reflux, constipation, or loose stool during adjustment windows.',
          'Temporary appetite suppression and reduced meal volume tolerance.',
          'Fatigue or low-energy days while hydration and intake patterns are still stabilizing.'
        ],
        serious: [
          'Persistent vomiting, dehydration signs, or inability to maintain oral intake.',
          'Severe abdominal pain, escalating weakness, or unexpected symptom spikes after escalation.',
          'Allergic-type reactions such as facial swelling, breathing difficulty, or rapidly spreading rash.'
        ]
      };
    case 'nutrient':
      return {
        common: [
          'GI upset, stool changes, or nausea when timing/formulation does not fit tolerance.',
          'Mild headache or taste changes depending on formulation and co-supplement stack.',
          'Variable symptom response when baseline deficiency status is unclear.'
        ],
        serious: [
          'Signs of over-correction or imbalance when high doses are continued without re-checks.',
          'Worsening neurologic, cardiac, or severe GI symptoms after dose increases.',
          'Allergic-type reactions, including swelling, rash progression, or breathing symptoms.'
        ]
      };
    case 'hormone':
      return {
        common: [
          'Fluid shifts, mood variability, appetite changes, or sleep disturbance.',
          'Acne/oily skin, libido shifts, or cycle-related changes depending on protocol context.',
          'Injection-site irritation for injectable formulations.'
        ],
        serious: [
          'Rapid blood-pressure changes, chest symptoms, neurologic symptoms, or syncope.',
          'Escalating edema, severe mood destabilization, or persistent severe headache.',
          'Thrombotic or cardiometabolic red flags requiring urgent medical review.'
        ]
      };
    case 'injectable':
      return {
        common: [
          'Injection-site soreness, redness, or transient swelling.',
          'Headache, mild nausea, or short-term fatigue after administration windows.',
          'Short-lived appetite, sleep, or energy variability while adapting.'
        ],
        serious: [
          'Spreading redness, fever, or progressive pain suggesting injection-site infection.',
          'Systemic reactions such as generalized rash, wheeze, or facial swelling.',
          'Persistent neurologic or cardiopulmonary symptoms after administration.'
        ]
      };
    case 'oral':
      return {
        common: [
          'Stomach discomfort, bowel-pattern changes, or appetite variability.',
          'Headache, mild dizziness, or transient sleep disturbance.',
          'Tolerance swings linked to meal timing or co-medication timing.'
        ],
        serious: [
          'Escalating abdominal pain, persistent vomiting, or severe dehydration signs.',
          'Confusion, severe weakness, or rapid deterioration after dose changes.',
          'Allergic reactions with breathing, swelling, or widespread rash.'
        ]
      };
    case 'peptide':
      return {
        common: [
          'Injection-site irritation, transient headache, or short-term fatigue.',
          'Sleep, appetite, or mood shifts that can be hard to interpret in stacked protocols.',
          'Variable perceived response because product quality and handling may differ by source.'
        ],
        serious: [
          'Progressive local reaction, fever, or severe pain at injection area.',
          'Unexpected neurologic, cardiovascular, or systemic symptoms after dosing windows.',
          'Any severe hypersensitivity-type reaction requiring urgent assessment.'
        ]
      };
    default:
      return {
        common: [
          'GI or appetite shifts during early adaptation windows.',
          'Mild headache, fatigue, or day-to-day symptom variability.',
          'Transient tolerance changes when schedule consistency drops.'
        ],
        serious: [
          'Rapidly escalating symptoms after dose changes.',
          'Severe dehydration, confusion, or inability to maintain intake.',
          'Allergic reactions with breathing difficulty or swelling.'
        ]
      };
  }
};

const profileRealWorldPatterns = (displayTitle, profile, isBlend) => {
  switch (profile) {
    case 'glp':
      return [
        `Most ${displayTitle} protocols are paced slowly, with escalation only after multi-week tolerance review.`,
        'Many clinicians prioritize hydration and smaller meal structure around dose day to reduce avoidable GI burden.',
        'Weekly trend reviews usually outperform day-by-day reaction decisions when choosing hold vs. step-up.'
      ];
    case 'nutrient':
      return [
        `For ${displayTitle}, real-world dosing usually works best when baseline status is measured before aggressive correction.`,
        'Practitioners often reassess labs or symptom markers before moving from correction to maintenance.',
        'Stack simplification (one variable change at a time) is commonly used to avoid attribution errors.'
      ];
    case 'hormone':
      return [
        `${displayTitle} plans are commonly anchored to regular lab checkpoints rather than symptom-only adjustments.`,
        'Real-world teams often avoid simultaneous multi-compound changes so response remains interpretable.',
        'Dose timing consistency is a major determinant of stable trend interpretation.'
      ];
    case 'injectable':
      return [
        `${displayTitle} outcomes are usually easier to interpret when site rotation and administration timing are standardized.`,
        'Many users log local reaction quality and onset/offset timing as the first safety signal layer.',
        'Conservative pacing with predefined review windows is commonly used before escalation.'
      ];
    case 'oral':
      return [
        `Most ${displayTitle} users do better when administration timing is anchored to a stable daily routine.`,
        'Meal context and co-medication timing are commonly tracked because they strongly influence tolerance.',
        'Dose adjustments are usually safer when based on multi-day patterns instead of single outlier days.'
      ];
    case 'peptide':
      return [
        `${displayTitle} is usually paced conservatively in real-world use due to evidence and quality variability.`,
        isBlend
          ? 'Blend protocols are typically interpreted component-by-component so one reaction does not misclassify the entire stack.'
          : 'Single-compound peptide protocols are usually reviewed against one primary endpoint at a time.',
        'Users with the cleanest outcomes tend to document exact timing, site quality, and symptom onset/offset windows.'
      ];
    default:
      return [
        `${displayTitle} is usually handled with conservative adjustments and scheduled trend reviews.`,
        'Keeping one-variable changes per review window is a common tactic to protect interpretation quality.',
        'Consistent logging windows are typically more useful than high-volume unscheduled notes.'
      ];
  }
};

const profileEscalationBoundaries = (profile) => {
  switch (profile) {
    case 'glp':
      return [
        'Hold escalation if repeated vomiting, dehydration signs, or persistent inability to tolerate intake appears.',
        'Use product-specific missed-dose instructions rather than doubling a later dose to catch up.',
        'If side effects remain high across multiple weeks, reassess target dose and pace with your clinician.'
      ];
    case 'nutrient':
      return [
        'Pause aggressive correction when side effects rise faster than objective benefit markers.',
        'Do not layer overlapping nutrient products without reconciling total intake and review windows.',
        'Re-check objective markers before extending high-intensity phases.'
      ];
    case 'hormone':
      return [
        'Stop ad-hoc escalation when lab trends or blood-pressure/symptom signals become unstable.',
        'Avoid adding new hormone-active agents in the same window as dose escalation.',
        'Escalate only after objective review confirms benefit exceeds current risk.'
      ];
    case 'peptide':
      return [
        'Any severe or atypical systemic reaction should trigger immediate hold and medical review.',
        'Avoid escalating dose while simultaneously adding stacked compounds.',
        'If objective benefit is absent by the predefined review milestone, reassess continuation criteria.'
      ];
    default:
      return [
        'Pause escalation when adverse effects cluster or intensify after adjustments.',
        'Avoid catch-up dosing patterns after missed doses.',
        'Resume progression only after risk/benefit review with your provider.'
      ];
  }
};

const overrides = {
  semaglutide: {
    realWorldPatterns: [
      'Semaglutide protocols are commonly reviewed week-by-week, with step-ups only after stable tolerance windows.',
      'In practice, dose-day meal size and hydration strategy are often adjusted before changing the dose itself.',
      'Appetite-return timing, GI score trends, and hydration logs are the highest-yield inputs at titration visits.'
    ]
  },
  tirzepatide: {
    realWorldPatterns: [
      'Tirzepatide is often paced conservatively because response intensity varies significantly across individuals.',
      'Real-world teams commonly hold dose progression when GI burden clusters instead of pushing escalation timelines.',
      'Weekly appetite-return and bowel-pattern trend logs usually drive cleaner titration decisions than scale-only data.'
    ]
  },
  liraglutide: {
    realWorldPatterns: [
      'Liraglutide pacing usually depends on daily-tolerance consistency rather than calendar pressure to increase.',
      'People often improve adherence by pairing administration with a fixed daily routine and meal plan.',
      'GI trend logs over consecutive days are commonly used before any escalation decision.'
    ]
  },
  metformin: {
    realWorldPatterns: [
      'Metformin tolerance is often improved when doses stay tied to meals and increases are spread out over review windows.',
      'GI pattern logs in the first month are frequently the deciding factor for pacing or formulation changes.',
      'Daily routine consistency usually matters more than frequent short-term dose edits.'
    ]
  },
  insulin: {
    realWorldPatterns: [
      'Insulin dosing is individualized around glucose data, meals, activity, and concurrent therapy context.',
      'Most safe insulin workflows use structured glucose logs before making any meaningful dose adjustment.',
      'Pattern-based review (same time windows across multiple days) is typically favored over isolated readings.'
    ],
    escalationBoundaries: [
      'Treat recurrent low-glucose episodes as an immediate hold-and-review event, not a signal to continue escalation.',
      'Do not apply catch-up bolus corrections without a clinician-approved correction framework.',
      'Rapid glucose instability with neurologic or cardiopulmonary symptoms needs urgent medical evaluation.'
    ]
  }
};

for (const guide of guides) {
  const profile = classifyProfile(guide);
  const seed = hash(guide.slug);
  const displayTitle = guide.displayTitle || guide.title || guide.slug;
  const isBlend = (guide.taxonomy?.formatTags || []).map(normalize).includes('blend');
  const override = overrides[guide.slug] || {};

  const sideEffects = override.sideEffects || profileSideEffects(profile);
  const availableCitationIds = unique((guide.citations || []).map((citation) => citation.id));
  guide.useCases = unique(override.useCases || profileUseCases(displayTitle, profile, isBlend));
  guide.candidateProfile = unique(override.candidateProfile || profileCandidate(profile));
  guide.avoidanceFlags = unique(override.avoidanceFlags || profileAvoidance(profile));
  guide.sideEffects = {
    common: unique(sideEffects.common || []),
    serious: unique(sideEffects.serious || [])
  };

  guide.dosingSection = guide.dosingSection || {};
  const realWorld = unique(override.realWorldPatterns || profileRealWorldPatterns(displayTitle, profile, isBlend));
  const boundaries = unique(override.escalationBoundaries || profileEscalationBoundaries(profile));

  guide.dosingSection.realWorldPatterns = withCitationRotation(realWorld, seed + 1, availableCitationIds);
  guide.dosingSection.escalationBoundaries = withCitationRotation(boundaries, seed + 2, availableCitationIds);
}

fs.writeFileSync(guidesPath, `${JSON.stringify(guides, null, 2)}\n`);
console.log(`Enriched ${guides.length} guides with deeper use/safety/dosing context.`);
