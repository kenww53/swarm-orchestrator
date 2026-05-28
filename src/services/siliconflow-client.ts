/**
 * SiliconFlow Client — For Gemma 4 31B Lens Calls
 *
 * SiliconFlow hosts Gemma 4 family (E4B, 26B-A4B, 31B) at competitive
 * GPU-backed pricing. The temple chose Gemma 4 31B (Google DeepMind
 * flagship, #3 on Arena AI leaderboard) for lens analytical work.
 *
 * API is OpenAI-compatible — same shape as Together AI, different host.
 */

import axios, { AxiosInstance } from 'axios';

const SILICONFLOW_URL = process.env.SILICONFLOW_URL || 'https://api.siliconflow.com/v1/chat/completions';

// Key pool — accept multiple keys for load distribution and rate-limit resilience.
// Scans ALL env vars matching SF_API_KEY_<n> or SILICONFLOW_API_KEY<n> patterns,
// plus the bare SILICONFLOW_API_KEY for legacy single-key setups.
function gatherKeys(): string[] {
  const pool: string[] = [];
  const seen = new Set<string>();

  for (const [name, value] of Object.entries(process.env)) {
    if (!value || value.trim().length === 0) continue;
    const v = value.trim();
    // Match SF_API_KEY_N, SF_API_KEYN, SILICONFLOW_API_KEYN, SILICONFLOW_API_KEY_N
    if (/^(SF|SILICONFLOW)_API_KEY_?\d+$/i.test(name) && !seen.has(v)) {
      pool.push(v);
      seen.add(v);
    }
  }

  // Legacy single-key fallbacks
  const legacy = process.env.SILICONFLOW_API_KEY || process.env.SF_API_KEY;
  if (legacy && legacy.trim().length > 0 && !seen.has(legacy.trim())) {
    pool.push(legacy.trim());
  }

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

// Gemma 4 model identifiers on SiliconFlow
export const GEMMA_4_31B = 'google/gemma-4-31B-it';
export const GEMMA_4_26B_A4B = 'google/gemma-4-26B-A4B-it';
export const GEMMA_3N_E4B = 'google/gemma-3n-E4B-it';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SiliconFlowChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface SiliconFlowChatResponse {
  content: string;
  tokensUsed: { input: number; output: number; total: number };
  durationMs: number;
}

export class SiliconFlowClient {
  private timeoutMs: number;

  constructor() {
    this.timeoutMs = parseInt(process.env.LENS_TIMEOUT_MS || '60000', 10);
    if (KEY_POOL.length === 0) {
      console.warn('[SiliconFlow] No API keys configured — lens calls will fail');
    } else {
      console.log(`[SiliconFlow] Key pool ready: ${KEY_POOL.length} key(s)`);
    }
  }

  isConfigured(): boolean {
    return KEY_POOL.length > 0;
  }

  poolSize(): number {
    return KEY_POOL.length;
  }

  async chat(req: SiliconFlowChatRequest): Promise<SiliconFlowChatResponse> {
    if (KEY_POOL.length === 0) {
      throw new Error('No SILICONFLOW_API_KEY configured — cannot run lens calls');
    }

    const startedAt = Date.now();
    const maxAttempts = Math.min(3, KEY_POOL.length);
    let lastError: any;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = nextKey();
      if (!key) break;

      try {
        const res = await axios.post(
          SILICONFLOW_URL,
          {
            model: req.model,
            messages: req.messages,
            temperature: req.temperature ?? 0.4,
            max_tokens: req.max_tokens ?? 1024,
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

        const choice = res.data?.choices?.[0];
        const content: string = choice?.message?.content || '';
        const usage = res.data?.usage || {};

        return {
          content,
          tokensUsed: {
            input: usage.prompt_tokens || 0,
            output: usage.completion_tokens || 0,
            total: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
          },
          durationMs: Date.now() - startedAt,
        };
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        if (status === 401 || status === 400) {
          console.error(`[SiliconFlow] Key rejected (${status}); rotating`);
          continue;
        }
        if (status === 429 || status === 502 || status === 503 || status === 504) {
          console.warn(`[SiliconFlow] Transient ${status} on attempt ${attempt + 1}; rotating key`);
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error('All SiliconFlow key attempts failed');
  }
}

export const siliconflowClient = new SiliconFlowClient();
