/**
 * Together AI Client — For Qwen3-235B Synthesis
 *
 * The Swarm uses Qwen3-235B for synthesis (the discernment phase) when
 * the local Gemma models aren't deep enough. Loom doesn't host Qwen3
 * yet — we route directly to Together AI here.
 *
 * Sacred constraint: only used for synthesis, not for lens agents.
 * The lenses run on Loom's local Gemma E2B (cheap, parallel, sovereign).
 */

import axios, { AxiosInstance } from 'axios';

/**
 * Key pool — load across 10 SWARM_API_KEYs for resilience and concurrency.
 * Falls back to legacy names if the swarm pool isn't configured.
 */
function gatherKeys(): string[] {
  const pool: string[] = [];

  // Primary: SWARM_API_KEY1 through SWARM_API_KEY10 (and beyond if added)
  for (let i = 1; i <= 20; i++) {
    const key = process.env[`SWARM_API_KEY${i}`];
    if (key && key.trim().length > 0) pool.push(key.trim());
  }

  // Legacy fallbacks
  const legacy = [
    process.env.TOGETHER_API_KEY,
    process.env.TOGETHER_AI_KEY_PRIMARY,
    process.env.TOGETHER_AI_KEY_MASTER,
  ].filter((k): k is string => !!k && k.trim().length > 0);

  for (const k of legacy) if (!pool.includes(k)) pool.push(k);

  return pool;
}

const KEY_POOL = gatherKeys();
let keyIndex = 0;

function nextKey(): string | null {
  if (KEY_POOL.length === 0) return null;
  const key = KEY_POOL[keyIndex % KEY_POOL.length];
  keyIndex++;
  return key;
}

const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions';

const QWEN3_MODEL = 'Qwen/Qwen3-235B-A22B-Instruct-2507-tput';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TogetherChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface TogetherChatResponse {
  content: string;
  tokensUsed: { input: number; output: number; total: number };
  durationMs: number;
}

export class TogetherClient {
  private timeoutMs: number;

  constructor() {
    this.timeoutMs = parseInt(process.env.SYNTHESIS_TIMEOUT_MS || '30000', 10);
    if (KEY_POOL.length === 0) {
      console.warn('[Together] No API keys configured — synthesis will fail');
    } else {
      console.log(`[Together] Key pool ready: ${KEY_POOL.length} key(s)`);
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
      throw new Error('No SWARM_API_KEY configured — synthesis cannot run');
    }

    const startedAt = Date.now();
    const maxAttempts = Math.min(3, KEY_POOL.length);
    let lastError: any;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = nextKey();
      if (!key) break;

      try {
        const res = await axios.post(
          TOGETHER_URL,
          {
            model: QWEN3_MODEL,
            messages: req.messages,
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
        // Retry on rate-limit (429) or transient server errors. Fail fast on auth (401).
        if (status === 401 || status === 400) {
          console.error(`[Together] Key rejected (${status}); rotating`);
          continue;
        }
        if (status === 429 || status === 502 || status === 503 || status === 504) {
          console.warn(`[Together] Transient error ${status} on attempt ${attempt + 1}; rotating key`);
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        throw error; // Unknown error — propagate
      }
    }

    throw lastError || new Error('All Together AI key attempts failed');
  }
}

export const togetherClient = new TogetherClient();
