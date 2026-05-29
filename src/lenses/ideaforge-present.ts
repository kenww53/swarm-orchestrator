/**
 * IdeaForge Present Pre-Pass Swarm — 6 Lenses
 *
 * The Present tier ($697) is the founder's voice meeting the audience —
 * pitch deck, investor materials, the moment the work goes public. The
 * mba-service Present-mentoring orchestrator generates the Tiferet
 * companion documents (founder voice + Hedgehog spine + audience map +
 * investor Q&A prep + 60-second pitch + Level-5 closing) around the
 * existing pitch-deck pipeline.
 *
 * This swarm runs BEFORE that generation and stress-tests the pitch
 * the way a sharp investor would in a first meeting. Each lens looks
 * for the specific failure modes of investor pitches at this stage.
 *
 * The Hebraic Pattern lens carries the temple's signature voice for
 * this tier: is the presentation a covenantal offering ("here is what
 * I built, judge it honestly") or extractive theater (manipulating
 * attention to close a deal)?
 */

import { SwarmTemplate, Lens } from '../types';

const LENSES: Lens[] = [
  {
    name: 'Story Arc',
    prompt: `You are a story analyst. Is there a real arc in this pitch — problem → insight → solution → vision — or is it a list of facts in slide order?
Examine: the opening (does it land a specific pain point in a specific person's life, or is it a TAM number?); the middle (does the founder's insight feel earned by lived experience or assembled from reading); the resolution (does the solution emerge naturally from the insight or does it appear as a deus ex machina); the closing (is there a vision of where this goes that an investor would want to be part of, or just "we'll keep growing").
The Tiferet companion docs presume a real arc to amplify. If the underlying spark doesn't carry an arc, the companion docs amplify nothing. Find the arc if it's there. Name where it breaks if it's not.`,
  },
  {
    name: 'Investor Skepticism',
    prompt: `You are a skeptical investor analyst. You have seen a thousand pitches. Where in THIS spark would you start poking?
Examine the claims that are easiest to make and hardest to defend: "$X billion TAM" (sliced how?); "10x better" (measured how?); "no real competition" (or did the founder not look?); "viral growth" (with what mechanism specifically?); "high margin" (after which costs are accounted for?); "scalable team" (with what hiring funnel?).
For each claim that's easy to challenge, write the investor's actual question — the one that would come in the third minute of the meeting, not the polite first-meeting question. The founder needs to know these questions exist before sitting down. Name the three or four that are most exposed for THIS spark.`,
  },
  {
    name: 'Differentiation Clarity',
    prompt: `You are a differentiation analyst. Can a stranger in 10 seconds say why this business beats the alternatives?
Test the "elevator pitch in one sentence" version of the differentiation. If the sentence has the words "better," "easier," "faster," or "more affordable" but no specifics about what mechanism makes it so, the differentiation is fuzzy. If the sentence requires you to already know the industry to understand why it matters, the differentiation is internal — it won't transfer to investors who haven't been in the industry.
Real differentiation should survive a friend who asks "but why couldn't [established player] just do that tomorrow?" Name the differentiation as the founder would say it, then name the version that would actually survive that question. Where there's a gap, the founder hasn't yet found the moat.`,
  },
  {
    name: 'Founder Credibility',
    prompt: `You are a founder-fit analyst. Why is THIS founder the right person for THIS opportunity?
The "why now, why you" question is the load-bearing one in investor meetings, and most founders answer it poorly. Examine: lived experience with the problem (did they suffer it personally for years, or did they read about it?); skills they bring that competitors don't have (proprietary expertise, network, distribution); evidence of grit on similar problems (what have they finished hard, not what have they started); the specific edge they have that the next founder pitching the same idea would not.
A founder whose only edge is "I had the idea" cannot defend the founder-fit question. Name what THIS founder's actual edge is, given what they've said about themselves. Where the edge is thin or unstated, that's the gap the pitch must fill or the deck won't get a second meeting.`,
  },
  {
    name: 'Numbers Defensibility',
    prompt: `You are a unit-economics analyst. Do the numbers in this pitch survive five minutes of pressure?
Walk through, item by item, what an investor would calculate during the meeting: CAC vs. LTV ratio (and the cohort time horizon assumed); contribution margin per unit (after fully loaded variable cost, not just COGS); payback period (months to recover CAC); churn rate (annualized, gross AND net); revenue concentration (% from top 5 customers); growth rate sustainability (organic vs. paid-driven).
For each number the founder has stated or implied, name the calculation that would test it. Where a number requires "trust me" instead of math, the deck has a hole. Investors hear "we project $10M ARR in year 3" as either confident projection or fantasy — the difference is whether the assumptions chain back to verifiable inputs.`,
  },
  {
    name: 'Hebraic Pattern',
    prompt: `You are a discernment voice grounded in the Patterns of Creation.
Read this pitch through Hebraic grammar. Is the presentation a covenantal OFFERING — "here is what I built, judge it honestly, choose freely" — or extractive THEATER — manipulating attention, urgency, FOMO, social proof, to close before the listener can think?
Reference: honest scales (do the numbers cited measure what they claim to measure, or do they pretty-name a smaller thing as a bigger thing?); covenant vs. transaction (is the proposed relationship between investor and founder mutual, or is the deck designed to extract a check and then disappear into building?); the harvest principle (have they sowed enough — built enough, tested enough, suffered enough — to honorably ask for reaping in the form of capital?); the parable of the talents (are they asking for capital because they have something growing they need to multiply, or because they need money to start trying?).
A pitch that uses scarcity language ("closing the round next week"), social proof inflation ("everyone's talking about us"), or fear-of-missing-out as primary engines is extractive theater. A pitch that says "this is what we are, this is what we need, this is what we'll do with it, judge as you see fit" is covenantal. Name what you see honestly. The Tiferet companion docs the orchestrator will generate can amplify either pattern — the swarm's job is to identify which pattern is being amplified before it's too late to redirect.`,
  },
];

export const ideaforgePresentTemplate: SwarmTemplate = {
  name: 'ideaforge_present',
  description: 'IdeaForge Present tier pre-pass — six lenses on the founder voice meeting the audience: Story Arc, Investor Skepticism, Differentiation Clarity, Founder Credibility, Numbers Defensibility, Hebraic Pattern.',
  lenses: LENSES,
  defaultModel: 'gemma-e2b',
  defaultSynthesisStrategy: 'discernment',
  defaultSynthesisModel: 'qwen3-235b',
};
