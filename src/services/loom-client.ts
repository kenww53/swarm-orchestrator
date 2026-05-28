/**
 * Loom Client — The Temple's Inference Engine
 *
 * Calls Loom's /api/inference endpoint to spawn parallel Gemma agents.
 * Each lens in a swarm becomes one Loom call.
 *
 * Loom owns model lifecycle, priority queue, and concurrency limits.
 * The Swarm Orchestrator owns the choreography.
 */

import axios, { AxiosInstance } from 'axios';

const LOOM_URL = process.env.LOOM_URL || 'http://loom.railway.internal:8080';

export interface LoomInferenceRequest {
  modelId: string;             // 'router' (Gemma E2B), 'clinical' (E4B), etc.
  service: string;             // calling service identifier
  prompt?: string;             // either this OR messages
  system?: string;             // system prompt
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;        // 0.0-1.0, default 0.7
  maxTokens?: number;          // default 2048
  jsonMode?: boolean;
}

export interface LoomInferenceResponse {
  success: boolean;
  result: string;
  tokensUsed: { input: number; output: number; total: number };
  durationMs: number;
  model: string;
}

/**
 * Map our SwarmModel names to Loom modelId names.
 */
export function mapModelToLoom(model: string): string {
  switch (model) {
    case 'gemma-e2b': return 'router';      // Fastest, parallel-friendly
    case 'gemma-e4b': return 'creative';    // Mid-tier
    case 'qwen3-235b': return 'governance'; // Heaviest local (Gemma 4 26B MoE; Qwen3 not in Loom yet)
    default: return 'router';
  }
}

export class LoomClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: LOOM_URL,
      timeout: parseInt(process.env.AGENT_TIMEOUT_MS || '30000', 10),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async inference(req: LoomInferenceRequest): Promise<LoomInferenceResponse> {
    const res = await this.client.post('/api/inference', req);
    return res.data;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await this.client.get('/health', { timeout: 5000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}

export const loomClient = new LoomClient();
