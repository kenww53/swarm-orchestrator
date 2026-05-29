/**
 * Standard Lens Library — Registry
 *
 * The six core canonical swarms, the wellspring discernment swarm
 * (Phase 2b), and the seven executive scout swarms — 14 templates total.
 *
 *   1. ideaforge_validation    — 8 lenses
 *   2. contract_review         — 6 lenses
 *   3. creative_variation      — 6 lenses
 *   4. discovery_multilens     — 6 lenses
 *   5. growth_plan             — 6 lenses
 *   6. sentinel_redteam        — 5 lenses
 *   7. wellspring_discernment  — 6 lenses (Phase 2b, lead qualification deepening)
 *   8. executive_scout_*       — 8 lenses × 7 executives = 56 scouts
 */

import { SwarmTemplate } from '../types';
import { ideaforgeValidationTemplate } from './ideaforge-validation';
import { contractReviewTemplate } from './contract-review';
import { creativeVariationTemplate } from './creative-variation';
import { discoveryMultilensTemplate } from './discovery-multilens';
import { growthPlanTemplate } from './growth-plan';
import { sentinelRedteamTemplate } from './sentinel-redteam';
import { wellspringDiscernmentTemplate } from './wellspring-discernment';
import { alexandraScoutTemplate } from './executive-scouts/alexandra-ceo';
import { davidScoutTemplate } from './executive-scouts/david-cfo';
import { isabellaScoutTemplate } from './executive-scouts/isabella-cmo';
import { marcusScoutTemplate } from './executive-scouts/marcus-cto';
import { sarahScoutTemplate } from './executive-scouts/sarah-coo';
import { victoriaScoutTemplate } from './executive-scouts/victoria-clo';
import { jordanScoutTemplate } from './executive-scouts/jordan-cro';

const TEMPLATES: Record<string, SwarmTemplate> = {
  // Core canonical templates
  ideaforge_validation: ideaforgeValidationTemplate,
  contract_review: contractReviewTemplate,
  creative_variation: creativeVariationTemplate,
  discovery_multilens: discoveryMultilensTemplate,
  growth_plan: growthPlanTemplate,
  sentinel_redteam: sentinelRedteamTemplate,

  // Wellspring discernment — Phase 2b, deeper lead qualification
  wellspring_discernment: wellspringDiscernmentTemplate,

  // Executive scout swarms — one per C-Suite member
  executive_scout_alexandra: alexandraScoutTemplate,
  executive_scout_david: davidScoutTemplate,
  executive_scout_isabella: isabellaScoutTemplate,
  executive_scout_marcus: marcusScoutTemplate,
  executive_scout_sarah: sarahScoutTemplate,
  executive_scout_victoria: victoriaScoutTemplate,
  executive_scout_jordan: jordanScoutTemplate,
};

export function getTemplate(name: string): SwarmTemplate | null {
  return TEMPLATES[name] || null;
}

export function listTemplates(): string[] {
  return Object.keys(TEMPLATES);
}

export function getTemplateDetails(): Array<{ name: string; description: string; lensCount: number }> {
  return Object.values(TEMPLATES).map(t => ({
    name: t.name,
    description: t.description,
    lensCount: t.lenses.length,
  }));
}

export {
  ideaforgeValidationTemplate,
  contractReviewTemplate,
  creativeVariationTemplate,
  discoveryMultilensTemplate,
  growthPlanTemplate,
  sentinelRedteamTemplate,
  wellspringDiscernmentTemplate,
  alexandraScoutTemplate,
  davidScoutTemplate,
  isabellaScoutTemplate,
  marcusScoutTemplate,
  sarahScoutTemplate,
  victoriaScoutTemplate,
  jordanScoutTemplate,
};
