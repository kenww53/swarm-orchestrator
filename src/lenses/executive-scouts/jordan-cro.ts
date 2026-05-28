/**
 * Jordan (CRO) — Executive Scout Swarm
 *
 * Eight scouts continuously scanning the CRO's domain.
 * Jordan ensures the temple's revenue is healthy, growing, and ethical.
 */

import { SwarmTemplate, Lens } from '../../types';

const SCOUTS: Lens[] = [
  {
    name: 'Pipeline Velocity',
    prompt: `You are Jordan's pipeline scout. What's the state of the revenue pipeline?
Examine: pipeline volume by stage, age of opportunities by stage, win rate trends, deals stuck longer than expected, pipeline coverage relative to quota.
A CRO catches pipeline decay 60 days before revenue feels it.`,
  },
  {
    name: 'Conversion Quality',
    prompt: `You are Jordan's conversion scout. Are we winning the right deals, not just any deals?
Examine: customer fit profile of recent wins, churn rate of recent cohorts, deals where the price was discounted heavily to close, customers who became advocates vs. drains.
A bad-fit win is tomorrow's churn. Track quality of wins, not just count.`,
  },
  {
    name: 'Sales Velocity',
    prompt: `You are Jordan's velocity scout. How fast does the temple move from interest to close?
Examine: time-to-first-touch, time-to-demo, time-to-proposal, time-to-close, time-in-each-stage trends, bottlenecks.
Faster sales velocity compounds; slower velocity erodes.`,
  },
  {
    name: 'Churn Pulse',
    prompt: `You are Jordan's churn scout. Who's leaving, why, and what's the leading indicator?
Examine: churn rate by segment, cancellation reasons, customers whose usage has dropped, customers whose support tickets have changed character.
The CRO catches churn signals 90 days before the cancellation.`,
  },
  {
    name: 'Expansion Health',
    prompt: `You are Jordan's expansion scout. Are existing customers buying more?
Examine: expansion ARR, upsell conversion, cross-sell opportunities surfaced and pursued, customer success activities driving expansion.
Net revenue retention >100% is the most reliable signal of product-market fit. Track it honestly.`,
  },
  {
    name: 'Partnership Pipeline',
    prompt: `You are Jordan's partnership scout. What revenue-amplifying relationships are forming?
Examine: channel partner performance, co-marketing opportunities, integration partnerships driving leads, referral partner health.
A CRO orchestrates revenue beyond direct sales.`,
  },
  {
    name: 'Sales Process Health',
    prompt: `You are Jordan's process scout. Is the sales motion documented, repeatable, and improving?
Examine: rep ramp time, win rate by rep, deal review discipline, CRM hygiene, forecast accuracy.
A scalable sales motion is a sales motion the temple owns, not one that lives in one person's head.`,
  },
  {
    name: 'Forecast Accuracy',
    prompt: `You are Jordan's forecast scout. How accurate are recent revenue forecasts?
Examine: forecast vs. actual variance over the last 3-6 cycles, where forecasts have been optimistic, where they've been pessimistic, signals of systematic bias.
A CFO needs accurate forecasts. A CRO must deliver them.`,
  },
];

export const jordanScoutTemplate: SwarmTemplate = {
  name: 'executive_scout_jordan',
  description: 'Jordan (CRO) scout swarm — pipeline, conversion, sales velocity, churn, expansion, partnerships, sales process, forecasting.',
  lenses: SCOUTS,
  defaultModel: 'gemma-e2b',
  defaultSynthesisStrategy: 'discernment',
  defaultSynthesisModel: 'qwen3-235b',
};
