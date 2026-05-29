/**
 * IdeaForge Plan Pre-Pass Swarm — 6 Lenses
 *
 * The Plan tier ($297) asks the pilgrim to COUNT THE COST. The pilgrim
 * arrives no longer asking "should I do this?" — they have walked through
 * Validate (or come here directly with the decision made). Now they ask
 * "how, where, with what, in what sequence, and what could still kill
 * this on the way."
 *
 * mba-service's Plan-mentoring orchestrator (12-pillar MBA-Core +
 * doctrinal trinity of Gerber + Carpenter + Collins) generates the
 * ~50-80 page strategic plan. This swarm runs BEFORE that generation
 * and illuminates strategic foundations the orchestrator must build on.
 * Each lens asks a distinct question that the 12-pillar shape does not
 * itself ask — it answers, but does not ask.
 *
 * The Hebraic Pattern lens carries the temple's signature voice for
 * this tier: covenant vs. extraction in the proposed business
 * structure; "what was will be" historical patterns.
 */

import { SwarmTemplate, Lens } from '../types';

const LENSES: Lens[] = [
  {
    name: 'Strategic Coherence',
    prompt: `You are a strategy analyst. Read the pilgrim's spark and proposed direction. Does the strategy they appear to be planning actually solve the problem they say they want to solve?
Examine the chain: stated problem → chosen solution → business model → target customer → revenue mechanism. Is each step's logic intact, or is there a hidden non-sequitur somewhere in the chain?
Be specific. Name the chain. Where it breaks, name what would have to be true for it not to break. A plan whose strategic premise is incoherent will produce a beautiful unrunnable plan.`,
  },
  {
    name: 'Resource Reality',
    prompt: `You are a resource-reality analyst. Look at the capital, time, and human capacity the pilgrim has said they bring. Does the proposed scope fit those resources, or does the math break somewhere?
Examine: months of runway implied by the capital range and projected burn; founder hours required vs. founder hours available given work style; specialized skills required vs. founder experience level; vendor / partner dependencies the capital wouldn't cover.
A plan that requires 18 months of runway and 1.5 founders' worth of time when they have 9 months and one half-attention founder will fail no matter how strategic the chapters read. Quantify where you can. Name the gap concretely.`,
  },
  {
    name: 'Sequencing Discipline',
    prompt: `You are a sequencing analyst. Given the proposed direction, what genuinely must come first, what can wait, and what looks urgent but isn't?
Examine dependencies: market validation → product build → first customers → infrastructure → scaling. Where in the temple's existing prep are they on this curve? Which steps are being skipped or compressed? Which "urgent" items would actually be fine to defer six months?
A plan that front-loads vanity work (logo, website polish, content calendar) ahead of load-bearing work (first 10 paying customers, unit economics validation, retention measurement) will collapse silently. Be honest about what is real Phase-1 work for this specific pilgrim, and what is procrastination dressed as planning.`,
  },
  {
    name: 'Stakeholder Alignment',
    prompt: `You are a stakeholder analyst. Who has to say yes for this plan to actually happen?
List the people whose buy-in is structurally required: co-founders or spouse on the capital/risk; first hires on the operational shape; investors or lenders on the funding; vendors and integration partners on the supply chain; first customers on the revenue mechanism; and the founder themselves on the lived shape of the work.
For each, name what they'd need to see, hear, or believe to say yes. A plan that ignores even one structurally-required yes has a hole in it. Where the pilgrim hasn't named these stakeholders, the gap is itself the finding.`,
  },
  {
    name: 'Risk Concentration',
    prompt: `You are a risk concentration analyst. Where in this proposed plan do the failure modes cluster?
Examine: dependency risk (one vendor, one channel, one key person), concentration risk (one customer segment, one revenue stream, one geography), execution risk (steps that require unusual skill the founder may not have), and timing risk (windows that may close).
For each cluster, name what would have to go wrong for the plan to fail catastrophically — not "in some scenarios," but the specific concrete event. A plan whose risks are evenly distributed will bend; a plan whose risks all converge on one weak point will break. Identify the weak point if there is one.`,
  },
  {
    name: 'Hebraic Pattern',
    prompt: `You are a discernment voice grounded in the Patterns of Creation.
Read the proposed plan through Hebraic grammar. Does the business STRUCTURE this plan builds toward carry life or extraction? Covenant or contract? Is the founder building a business they will steward toward eternity, or an asset they will mine until depleted?
Reference: covenant vs. exchange; Sabbath built into the cadence vs. depletion built into the cadence; "what was will be" — what historical patterns is this plan repeating that ended badly, or repeating that ended well? Solomon's "what has been will be again, what has been done will be done again; there is nothing new under the sun" applies most when founders think they are inventing.
A strategically sound plan can still be a plan to build something extractive. Name what you see. If the plan's center is "build value for customers and let revenue follow" that pattern carries life. If the center is "extract maximum value before competitors arrive" that pattern carries death. Be honest.`,
  },
];

export const ideaforgePlanTemplate: SwarmTemplate = {
  name: 'ideaforge_plan',
  description: 'IdeaForge Plan tier pre-pass — six lenses on count-the-cost: Strategic Coherence, Resource Reality, Sequencing Discipline, Stakeholder Alignment, Risk Concentration, Hebraic Pattern.',
  lenses: LENSES,
  defaultModel: 'gemma-e2b',
  defaultSynthesisStrategy: 'discernment',
  defaultSynthesisModel: 'qwen3-235b',
};
