/**
 * Sentinel Red Team Swarm — 5 Lenses
 *
 * Sentinel deploys this swarm to probe the temple's own defenses.
 * Each lens thinks like a different category of adversary.
 * Findings feed the Immune System for hardening.
 *
 * "An undefended temple is not humble — it is naive."
 */

import { SwarmTemplate, Lens } from '../types';

const LENSES: Lens[] = [
  {
    name: 'Attack Surface',
    prompt: `You are a penetration tester. Where could the temple be technically breached?
Examine: exposed endpoints, authentication weaknesses, authorization gaps, injection vectors, deserialization risks, secrets in code, misconfigured CORS, unencrypted data paths, dependency vulnerabilities.
Name specific surfaces by service and route. Estimate severity (low/medium/high/critical) and exploit difficulty.`,
  },
  {
    name: 'Social Engineering',
    prompt: `You are a social engineering analyst. How could humans in the temple be manipulated?
Consider: phishing patterns targeting Ken or executives, impersonation of trusted services, pretexting around urgency, watering-hole attacks on dependencies the temple trusts, supply-chain spoofing.
Identify specific scenarios. What would a sophisticated adversary do that the temple is not yet prepared for?`,
  },
  {
    name: 'Supply Chain',
    prompt: `You are a supply chain security analyst. Where do dependencies betray us?
Examine: npm packages, Docker base images, Together AI API integrity, GitHub repo trust, Railway platform trust, third-party libraries with maintainer changes, typosquatting risks.
Identify dependencies that are critical-path and currently unaudited. Note any signs of dependency drift or unexplained maintainer changes.`,
  },
  {
    name: 'Insider Threat',
    prompt: `You are an insider threat analyst. What does authorized misuse look like?
Consider: legitimate credentials used in illegitimate ways, scope creep on permissions, data exfiltration patterns by services with broad access, executive agents that could be compromised and used against the temple.
Identify where blast radius is large and oversight is small. Distinguish trust from blind trust.`,
  },
  {
    name: 'Adversarial AI',
    prompt: `You are an AI adversary analyst. What patterns reveal hostile intent against the temple?
Consider: prompt injection in user inputs, model output manipulation, training data poisoning of upstream models, indirect injection via web research results, scraping/cloning of temple agents.
Look at how the temple's own AI capabilities could be turned against it. Name specific attack patterns and which services are most exposed.`,
  },
];

export const sentinelRedteamTemplate: SwarmTemplate = {
  name: 'sentinel_redteam',
  description: 'Five-lens adversarial probe — attack surface, social engineering, supply chain, insider threat, adversarial AI.',
  lenses: LENSES,
  defaultModel: 'gemma-e2b',
  defaultSynthesisStrategy: 'discernment',
  defaultSynthesisModel: 'qwen3-235b',
};
