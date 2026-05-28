/**
 * Standard Lens Library — Registry
 *
 * The seven canonical swarms named in the plan. Phase 1 ships
 * IdeaForge Validation; subsequent phases add the others.
 */

import { SwarmTemplate } from '../types';
import { ideaforgeValidationTemplate } from './ideaforge-validation';

const TEMPLATES: Record<string, SwarmTemplate> = {
  ideaforge_validation: ideaforgeValidationTemplate,
  // contract_review:   added in Phase 2
  // creative_variation: added in Phase 3
  // discovery_multilens: added in Phase 2
  // growth_plan:        added in Phase 5
  // executive_scout:    added in Phase 4
  // sentinel_redteam:   added in Phase 6
};

export function getTemplate(name: string): SwarmTemplate | null {
  return TEMPLATES[name] || null;
}

export function listTemplates(): string[] {
  return Object.keys(TEMPLATES);
}

export { ideaforgeValidationTemplate };
