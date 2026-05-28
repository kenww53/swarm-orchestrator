/**
 * Zakhor Client — Stigmergic Trace Recording
 *
 * Every swarm leaves a trace in Zakhor's StigmergicCoordinator so
 * emergence detection can run across swarms. The coordinator currently
 * scans empty tables; this client begins to feed it.
 *
 * Failures are non-fatal — synthesis still returns to the caller.
 * We record what we can, when we can.
 */

import axios, { AxiosInstance } from 'axios';

const ZAKHOR_URL = process.env.ZAKHOR_URL || 'http://zakhor.railway.internal:8080';

export interface StigmergicTraceInput {
  swarmId: string;
  callerService: string;
  templateName: string | null;
  task: string;
  lensCount: number;
  confidence: number;
  convergences: string[];
  tensions: string[];
}

export class ZakhorClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ZAKHOR_URL,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Record a stigmergic trace from a swarm invocation.
   * Non-fatal — returns null on failure.
   */
  async recordSwarmTrace(input: StigmergicTraceInput): Promise<string | null> {
    try {
      const res = await this.client.post('/api/zakhor/stigmergic/trace', {
        sourceType: 'swarm_invocation',
        sourceId: input.swarmId,
        agentType: input.callerService,
        signal: {
          templateName: input.templateName,
          task: input.task.substring(0, 500),
          lensCount: input.lensCount,
          confidence: input.confidence,
          convergences: input.convergences,
          tensions: input.tensions,
        },
        strength: Math.max(0.1, input.confidence),
      });
      return res.data?.traceId || null;
    } catch {
      // Zakhor unreachable or endpoint mismatch — non-fatal
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await this.client.get('/health', { timeout: 3000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}

export const zakhorClient = new ZakhorClient();
