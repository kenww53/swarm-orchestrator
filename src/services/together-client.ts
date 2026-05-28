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

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY
  || process.env.TOGETHER_AI_KEY_PRIMARY
  || process.env.TOGETHER_AI_KEY_MASTER
  || '';

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
  private client: AxiosInstance;
  private hasKey: boolean;

  constructor() {
    this.hasKey = TOGETHER_API_KEY.length > 0;
    this.client = axios.create({
      baseURL: TOGETHER_URL,
      timeout: parseInt(process.env.SYNTHESIS_TIMEOUT_MS || '30000', 10),
      headers: {
        'Content-Type': 'application/json',
        ...(this.hasKey ? { 'Authorization': `Bearer ${TOGETHER_API_KEY}` } : {}),
      },
    });
  }

  isConfigured(): boolean {
    return this.hasKey;
  }

  async chat(req: TogetherChatRequest): Promise<TogetherChatResponse> {
    if (!this.hasKey) {
      throw new Error('TOGETHER_API_KEY not configured — synthesis cannot run');
    }

    const startedAt = Date.now();
    const res = await this.client.post('', {
      model: QWEN3_MODEL,
      messages: req.messages,
      temperature: req.temperature ?? 0.5,
      max_tokens: req.max_tokens ?? 4000,
      top_p: req.top_p ?? 0.9,
    });

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
  }
}

export const togetherClient = new TogetherClient();
