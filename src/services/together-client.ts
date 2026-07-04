/**
 * DeepInfra Nemotron Client — Swarm Synthesis
 *
 * The Swarm uses Nemotron-120B Super for synthesis (the discernment phase) when
 * the local Gemma models aren't deep enough. Loom doesn't host it yet — we route
 * directly to DeepInfra here.
 *
 * The temple migrated Qwen3-235B (Together.ai) -> nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
 * (DeepInfra). Nemotron leaks chain-of-thought into `content` unless the system prompt
 * says 'detailed thinking off' — this client folds that in for Nemotron models.
 *
 * Sacred constraint: only used for synthesis, not for lens agents.
 * The lenses run on SiliconFlow / Loom's local Gemma (cheap, parallel, sovereign).
 */

import axios, { AxiosInstance } from 'axios';

/**
 * Key pool — DeepInfra DI_API_KEY_# (case-insensitive), round-robined for resilience.
 */
function gatherKeys(): string[] {
  return Object.keys(process.env)
    .filter((k) => /^DI_API_KEY/i.test(k))
    .map((k) => process.env[k])
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 20)
    .map((v) => v.trim());
}

const KEY_POOL = gatherKeys();
let keyIndex = 0;

function nextKey(): string | null {
  if (KEY_POOL.length === 0) return null;
  const key = KEY_POOL[keyIndex % KEY_POOL.length];
  keyIndex++;
  return key;
}

const DEEPINFRA_URL = process.env.SI_JUDGE_URL
  ? `${process.env.SI_JUDGE_URL}/chat/completions`
  : 'https://api.deepinfra.com/v1/openai/chat/completions';

// Synthesis model: Nemotron-120B Super for deep multi-perspective integration.
const SYNTHESIS_MODEL =
  process.env.SWARM_SYNTHESIS_MODEL || 'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B';

// Legacy lens-model constants (kept for imports; lenses now run via SiliconFlow / Loom).
export const GEMMA_4_31B = 'google/gemma-4-31B-it';
export const GEMMA_4_26B_A4B = 'google/gemma-4-26B-A4B-it';
export const GEMMA_3N_E4B = 'google/gemma-3n-E4B-it';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TogetherChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  model?: string;  // Defaults to the synthesis model; override for special calls
}

export interface TogetherChatResponse {
  content: string;
  tokensUsed: { input: number; output: number; total: number };
  durationMs: number;
}

/**
 * Nemotron leaks chain-of-thought into `content` unless told 'detailed thinking off'.
 * Fold that directive into the first system message (or prepend one).
 */
function withThinkingOff(messages: ChatMessage[]): ChatMessage[] {
  const idx = messages.findIndex((m) => m.role === 'system');
  if (idx >= 0) {
    const copy = messages.slice();
    copy[idx] = { ...copy[idx], content: `detailed thinking off\n${copy[idx].content}` };
    return copy;
  }
  return [{ role: 'system', content: 'detailed thinking off' }, ...messages];
}

export class TogetherClient {
  private timeoutMs: number;

  constructor() {
    this.timeoutMs = parseInt(process.env.SYNTHESIS_TIMEOUT_MS || '90000', 10);
    if (KEY_POOL.length === 0) {
      console.warn('[Synthesis] No DeepInfra keys configured (DI_API_KEY_#) — synthesis will fail');
    } else {
      console.log(`[Synthesis] DeepInfra key pool ready: ${KEY_POOL.length} key(s)`);
    }
  }

  isConfigured(): boolean {
    return KEY_POOL.length > 0;
  }

  poolSize(): number {
    return KEY_POOL.length;
  }

  async chat(req: TogetherChatRequest): Promise<TogetherChatResponse> {
    if (KEY_POOL.length === 0) {
      throw new Error('No DI_API_KEY configured — synthesis cannot run');
    }

    const model = req.model || SYNTHESIS_MODEL;
    const messages = /nemotron/i.test(model) ? withThinkingOff(req.messages) : req.messages;

    const startedAt = Date.now();
    const maxAttempts = Math.min(3, KEY_POOL.length);
    let lastError: any;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = nextKey();
      if (!key) break;

      try {
        const res = await axios.post(
          DEEPINFRA_URL,
          {
            model,
            messages,
            temperature: req.temperature ?? 0.5,
            max_tokens: req.max_tokens ?? 4000,
            top_p: req.top_p ?? 0.9,
          },
          {
            timeout: this.timeoutMs,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`,
            },
          }
        );

        const choice = res.data.choices?.[0];
        const content = choice?.message?.content || '';
        const usage = res.data.usage || {};

        return {
          content,
          tokensUsed: {
            input: usage.prompt_tokens || 0,
            output: usage.completion_tokens || 0,
            total: usage.total_tokens || 0,
          },
          durationMs: Date.now() - startedAt,
        };
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        // Retry on rate-limit (429) or transient server errors. Fail fast on auth (401/400).
        if (status === 401 || status === 400) {
          console.error(`[Synthesis] Key rejected (${status}); rotating`);
          continue;
        }
        if (status === 429 || status === 502 || status === 503 || status === 504) {
          console.warn(`[Synthesis] Transient error ${status} on attempt ${attempt + 1}; rotating key`);
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        throw error; // Unknown error — propagate
      }
    }

    throw lastError || new Error('All DeepInfra key attempts failed');
  }
}

export const togetherClient = new TogetherClient();
