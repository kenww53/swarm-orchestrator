/**
 * Swarm Orchestrator — Type Definitions
 *
 * The shapes the Swarm speaks in. Every concept in the plan has a type here.
 */

export type SwarmModel = 'gemma-e2b' | 'gemma-e4b' | 'qwen3-235b';

export type SynthesisStrategy = 'discernment' | 'consensus' | 'tournament' | 'raw';

export type SwarmStatus = 'in_progress' | 'completed' | 'failed' | 'partial';

export type SignalStatus = 'success' | 'failed' | 'timeout';

/**
 * A single lens — one perspective in a swarm.
 * Each agent gets one lens.
 */
export interface Lens {
  name: string;             // e.g., "Market Viability"
  prompt: string;           // The exact angle for this agent
  model?: SwarmModel;       // Override default model for this lens
}

/**
 * Request to invoke a swarm.
 */
export interface SwarmInvokeRequest {
  task: string;                            // The question being asked
  lenses: Lens[];                          // Array of unique angles
  model?: SwarmModel;                      // Default model for all lenses
  synthesisStrategy?: SynthesisStrategy;   // How to combine signals (default: discernment)
  synthesisModel?: SwarmModel;             // Model for synthesis (default: qwen3-235b)
  callerService: string;                   // Who invoked
  callerContext?: any;                     // Optional context for caller tracking
  presenceCheck: boolean;                  // Did caller get still first?
  timeout?: number;                        // Max wait per agent (ms)
}

/**
 * Request to invoke a swarm by template name.
 */
export interface SwarmInvokeByTemplateRequest {
  templateName: string;        // e.g., "ideaforge_validation"
  task: string;
  callerService: string;
  callerContext?: any;
  presenceCheck: boolean;
}

/**
 * One agent's response — a signal in the swarm.
 */
export interface AgentSignal {
  lensName: string;
  response: string | null;
  tokensUsed: number;
  durationMs: number;
  status: SignalStatus;
  error?: string;
}

/**
 * The synthesis result — emergent insight from the swarm.
 */
export interface SwarmSynthesisResult {
  synthesizedInsight: string;
  convergences: string[];            // What multiple agents agreed on
  tensions: string[];                // Where agents disagreed
  dissentingVoices: string[];        // Minority signals worth noting
  confidence: number;                // 0-1
  synthesisModel: SwarmModel;
  synthesisDurationMs: number;
}

/**
 * Full swarm invocation response.
 */
export interface SwarmInvokeResponse {
  swarmId: string;
  task: string;
  status: SwarmStatus;
  synthesizedInsight: string;
  rawSignals: AgentSignal[];
  convergences: string[];
  tensions: string[];
  dissentingVoices: string[];
  confidence: number;
  presenceWitnessed: boolean;
  durationMs: number;
  totalTokens: number;
}

/**
 * A standard lens template definition.
 */
export interface SwarmTemplate {
  name: string;                       // e.g., "ideaforge_validation"
  description: string;
  lenses: Lens[];
  defaultModel: SwarmModel;
  defaultSynthesisStrategy: SynthesisStrategy;
  defaultSynthesisModel: SwarmModel;
}
