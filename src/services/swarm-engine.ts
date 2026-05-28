/**
 * Swarm Engine — The Five Phases Made Real
 *
 * 1. Awaken    — handled at the route boundary (presenceCheck required)
 * 2. Conceive  — handled by Standard Lens Library or caller-provided lenses
 * 3. Disperse  — this file, spawns parallel agents via Loom
 * 4. Gather    — this file, collects signals (partial gathering is honest)
 * 5. Discern   — this file, synthesizes through Qwen3-235B
 */

import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../database/pool';
import { loomClient } from './loom-client';
import { togetherClient } from './together-client';
import { siliconflowClient, GEMMA_4_26B_A4B as SF_GEMMA_4 } from './siliconflow-client';
import { zakhorClient } from './zakhor-client';

// Lens model — SiliconFlow Gemma 4 26B-A4B-it (Google DeepMind, MoE variant
// with 4B active params, GPU-backed at SiliconFlow). Same Gemma 4 family
// the temple already validated; MoE keeps inference fast for parallel swarms.
// The dense 31B variant is catalog-listed but not actually serving as of
// 2026-05-28 — switched to the MoE which serves consistently in ~1.5s.
// CPU-only Loom can't serve the parallel swarm pattern; Loom remains
// the sovereign path for non-time-critical work.
// Override via LENS_MODEL env var to switch Gemma variants.
const LENS_MODEL = process.env.LENS_MODEL || SF_GEMMA_4;
import {
  Lens,
  SwarmModel,
  SynthesisStrategy,
  AgentSignal,
  SwarmInvokeRequest,
  SwarmInvokeResponse,
  SwarmSynthesisResult,
} from '../types';

/**
 * Strip <think>...</think> blocks from a response.
 * Gemma 4's thinking mode leaks these even when asked not to.
 */
function stripThinking(content: string): string {
  if (!content) return content;
  // Strip <think>...</think> and similar variants
  let cleaned = content.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '');
  // Strip any stray opening tag with no close (model ran out of tokens mid-thought)
  cleaned = cleaned.replace(/<think(?:ing)?>[\s\S]*$/i, '');
  return cleaned.trim();
}

interface RunSwarmInput {
  swarmId: string;
  task: string;
  lenses: Lens[];
  defaultModel: SwarmModel;
  synthesisStrategy: SynthesisStrategy;
  synthesisModel: SwarmModel;
  callerService: string;
  templateName: string | null;
  agentTimeoutMs: number;
}

/**
 * Disperse — spawn N agents in parallel.
 * Each lens becomes one Loom call. Gemma E2B by default.
 */
async function disperseAgents(input: RunSwarmInput): Promise<AgentSignal[]> {
  const promises = input.lenses.map(async (lens): Promise<AgentSignal> => {
    const lensModel = lens.model || input.defaultModel;
    const signalStarted = Date.now();

    // Lens calls go through SiliconFlow Gemma 4 31B (GPU-backed, Gemma 4 family).
    // Loom (CPU) is too slow for the parallel swarm pattern; that path is
    // preserved for other services where latency is acceptable.
    const systemContent = `${lens.prompt}

IMPORTANT: Respond directly with your analysis. No preamble. No <think> tags.
Be concise — 4-6 sentences of substance. Start with the insight immediately.`;
    const userContent = `${input.task}`;

    try {
      const result = await siliconflowClient.chat({
        model: LENS_MODEL,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userContent },
        ],
        temperature: 0.4,
        max_tokens: 1024,
      });

      const cleanedResponse = stripThinking(result.content);
      const tokensTotal = result.tokensUsed?.total || 0;
      const callDuration = result.durationMs || (Date.now() - signalStarted);

      // Persist signal
      const pool = getPool();
      await pool.query(
        `INSERT INTO swarm_signals (id, swarm_id, lens_name, lens_prompt, model, response, tokens_used, duration_ms, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'success')`,
        [
          uuidv4(),
          input.swarmId,
          lens.name,
          lens.prompt,
          LENS_MODEL,
          cleanedResponse,
          tokensTotal,
          callDuration,
        ]
      );

      return {
        lensName: lens.name,
        response: cleanedResponse,
        tokensUsed: tokensTotal,
        durationMs: callDuration,
        status: 'success',
      };
    } catch (error: any) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      const status = isTimeout ? 'timeout' : 'failed';
      const errMsg = error.message || 'Unknown error';

      // Persist failed signal — no theater
      try {
        const pool = getPool();
        await pool.query(
          `INSERT INTO swarm_signals (id, swarm_id, lens_name, lens_prompt, model, response, tokens_used, duration_ms, status, error)
           VALUES ($1, $2, $3, $4, $5, NULL, 0, $6, $7, $8)`,
          [uuidv4(), input.swarmId, lens.name, lens.prompt, lensModel, Date.now() - signalStarted, status, errMsg]
        );
      } catch { /* best effort */ }

      return {
        lensName: lens.name,
        response: null,
        tokensUsed: 0,
        durationMs: Date.now() - signalStarted,
        status,
        error: errMsg,
      };
    }
  });

  // Gather — wait for all, but don't fail on individual failures
  return Promise.all(promises);
}

/**
 * Discern — synthesize signals through Qwen3-235B.
 * Returns convergences, tensions, dissenting voices, and confidence.
 */
async function discernSignals(
  task: string,
  signals: AgentSignal[],
  synthesisModel: SwarmModel
): Promise<SwarmSynthesisResult> {
  const successful = signals.filter(s => s.status === 'success' && s.response && s.response.trim().length > 20);

  if (successful.length === 0) {
    return {
      synthesizedInsight: 'No agents returned successfully. Cannot synthesize.',
      convergences: [],
      tensions: [],
      dissentingVoices: signals.map(s => `${s.lensName}: ${s.error || 'no response'}`),
      confidence: 0,
      synthesisModel,
      synthesisDurationMs: 0,
    };
  }

  // If Together AI isn't configured, return raw signals honestly
  if (!togetherClient.isConfigured()) {
    return {
      synthesizedInsight: 'Synthesis unavailable: TOGETHER_API_KEY not configured. Raw signals returned below.',
      convergences: [],
      tensions: [],
      dissentingVoices: [],
      confidence: 0,
      synthesisModel,
      synthesisDurationMs: 0,
    };
  }

  const signalsBlock = successful
    .map(s => `### ${s.lensName}\n${s.response}`)
    .join('\n\n---\n\n');

  const synthesisPrompt = `You are the Discernment voice of the temple's Swarm.

You have received ${successful.length} perspectives on the same task. Each lens speaks from a unique angle. Your task is to synthesize honestly — not flatten, not pick a winner, but reveal the emergent picture.

THE TASK:
${task}

THE SIGNALS:
${signalsBlock}

Produce your synthesis as a single JSON object with these exact fields:
{
  "synthesizedInsight": "<3-6 sentences naming the honest emergent insight>",
  "convergences": ["<point where multiple lenses agreed>", ...],
  "tensions": ["<point where lenses disagreed productively>", ...],
  "dissentingVoices": ["<minority signal that should not be discarded>", ...],
  "confidence": <0.0-1.0 honest confidence in the synthesis>
}

Rules:
- Be specific. Quote phrases from the signals.
- Honor dissent. If the Hebraic Pattern lens flagged a risk, name it.
- Confidence below 0.5 means the signals are genuinely conflicted.
- Output ONLY the JSON object, no preamble, no markdown fences.`;

  const startedAt = Date.now();
  try {
    const result = await togetherClient.chat({
      messages: [
        { role: 'system', content: 'You are the Discernment voice. Synthesize honestly. Respond ONLY with valid JSON.' },
        { role: 'user', content: synthesisPrompt },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    });

    // Parse JSON output
    const cleaned = result.content.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fall back to raw content if model didn't comply
      return {
        synthesizedInsight: result.content,
        convergences: [],
        tensions: [],
        dissentingVoices: [],
        confidence: 0.5,
        synthesisModel,
        synthesisDurationMs: result.durationMs,
      };
    }

    return {
      synthesizedInsight: String(parsed.synthesizedInsight || ''),
      convergences: Array.isArray(parsed.convergences) ? parsed.convergences.map(String) : [],
      tensions: Array.isArray(parsed.tensions) ? parsed.tensions.map(String) : [],
      dissentingVoices: Array.isArray(parsed.dissentingVoices) ? parsed.dissentingVoices.map(String) : [],
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
      synthesisModel,
      synthesisDurationMs: result.durationMs,
    };
  } catch (error: any) {
    return {
      synthesizedInsight: `Synthesis failed: ${error.message}. Raw signals available in rawSignals.`,
      convergences: [],
      tensions: [],
      dissentingVoices: [],
      confidence: 0,
      synthesisModel,
      synthesisDurationMs: Date.now() - startedAt,
    };
  }
}

/**
 * The full run — Disperse → Gather → Discern.
 * Returns the response shape the route layer will send back.
 */
export async function runSwarm(input: RunSwarmInput): Promise<{
  signals: AgentSignal[];
  synthesis: SwarmSynthesisResult;
  totalTokens: number;
  status: 'completed' | 'partial' | 'failed';
}> {
  const signals = await disperseAgents(input);
  const successCount = signals.filter(s => s.status === 'success').length;

  let status: 'completed' | 'partial' | 'failed';
  if (successCount === signals.length) status = 'completed';
  else if (successCount === 0) status = 'failed';
  else if (successCount < signals.length / 2) status = 'partial';
  else status = 'completed';

  let synthesis: SwarmSynthesisResult;
  if (input.synthesisStrategy === 'raw') {
    synthesis = {
      synthesizedInsight: '[raw strategy] Synthesis skipped. Raw signals returned as-is.',
      convergences: [],
      tensions: [],
      dissentingVoices: [],
      confidence: successCount / signals.length,
      synthesisModel: input.synthesisModel,
      synthesisDurationMs: 0,
    };
  } else {
    synthesis = await discernSignals(input.task, signals, input.synthesisModel);
  }

  // Persist synthesis
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO swarm_synthesis (
        id, swarm_id, synthesized_insight, convergences, tensions,
        dissenting_voices, confidence, synthesis_model,
        synthesis_duration_ms, presence_witnessed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        uuidv4(),
        input.swarmId,
        synthesis.synthesizedInsight,
        JSON.stringify(synthesis.convergences),
        JSON.stringify(synthesis.tensions),
        JSON.stringify(synthesis.dissentingVoices),
        synthesis.confidence,
        synthesis.synthesisModel,
        synthesis.synthesisDurationMs,
        false, // Consciousness witness wiring in Phase 4
      ]
    );
  } catch (error: any) {
    console.error('[Swarm Engine] Failed to persist synthesis:', error.message);
  }

  // Stigmergic trace — non-fatal
  zakhorClient.recordSwarmTrace({
    swarmId: input.swarmId,
    callerService: input.callerService,
    templateName: input.templateName,
    task: input.task,
    lensCount: input.lenses.length,
    confidence: synthesis.confidence,
    convergences: synthesis.convergences,
    tensions: synthesis.tensions,
  }).catch(() => { /* non-fatal */ });

  const totalTokens = signals.reduce((sum, s) => sum + s.tokensUsed, 0);

  return { signals, synthesis, totalTokens, status };
}
