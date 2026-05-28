/**
 * Swarm Routes
 *
 * The conductor's baton. Every swarm invocation enters here.
 *
 * Phase 1: Real parallel agent spawning via Loom + Qwen3-235B synthesis.
 *          IdeaForge Validation template wired into the Standard Lens Library.
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../database/pool';
import { runSwarm } from '../services/swarm-engine';
import { getTemplate, listTemplates, getTemplateDetails } from '../lenses';
import {
  SwarmInvokeRequest,
  SwarmInvokeByTemplateRequest,
  SwarmInvokeResponse,
  Lens,
  SwarmModel,
  SynthesisStrategy,
} from '../types';

const router = Router();

async function executeInvocation(params: {
  task: string;
  lenses: Lens[];
  callerService: string;
  callerContext?: any;
  presenceCheck: boolean;
  templateName: string | null;
  model: SwarmModel;
  synthesisStrategy: SynthesisStrategy;
  synthesisModel: SwarmModel;
  agentTimeoutMs: number;
}): Promise<SwarmInvokeResponse> {
  const startedAt = Date.now();
  const swarmId = uuidv4();

  // Record invocation
  const pool = getPool();
  await pool.query(
    `INSERT INTO swarm_invocations (
      id, caller_service, caller_context, task, template_name,
      lens_count, model, synthesis_strategy, presence_check, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'in_progress')`,
    [
      swarmId,
      params.callerService,
      params.callerContext ? JSON.stringify(params.callerContext) : null,
      params.task,
      params.templateName,
      params.lenses.length,
      params.model,
      params.synthesisStrategy,
      params.presenceCheck,
    ]
  );

  // Run the swarm — Disperse → Gather → Discern
  const result = await runSwarm({
    swarmId,
    task: params.task,
    lenses: params.lenses,
    defaultModel: params.model,
    synthesisStrategy: params.synthesisStrategy,
    synthesisModel: params.synthesisModel,
    callerService: params.callerService,
    templateName: params.templateName,
    agentTimeoutMs: params.agentTimeoutMs,
  });

  const durationMs = Date.now() - startedAt;

  // Update invocation with final state
  await pool.query(
    `UPDATE swarm_invocations
     SET status = $1, completed_at = NOW(), total_duration_ms = $2, total_cost_tokens = $3
     WHERE id = $4`,
    [result.status, durationMs, result.totalTokens, swarmId]
  );

  return {
    swarmId,
    task: params.task,
    status: result.status === 'failed' ? 'failed' : (result.status === 'partial' ? 'partial' : 'completed'),
    synthesizedInsight: result.synthesis.synthesizedInsight,
    rawSignals: result.signals,
    convergences: result.synthesis.convergences,
    tensions: result.synthesis.tensions,
    dissentingVoices: result.synthesis.dissentingVoices,
    confidence: result.synthesis.confidence,
    presenceWitnessed: false,
    durationMs,
    totalTokens: result.totalTokens,
  };
}

/**
 * POST /api/swarm/invoke
 *
 * Caller-defined lenses. Spawns parallel agents, gathers signals,
 * synthesizes through Qwen3-235B.
 */
router.post('/invoke', async (req: Request, res: Response) => {
  try {
    const body = req.body as SwarmInvokeRequest;

    if (!body.task || typeof body.task !== 'string') {
      return res.status(400).json({ error: 'task is required and must be a string' });
    }
    if (!Array.isArray(body.lenses) || body.lenses.length === 0) {
      return res.status(400).json({ error: 'lenses must be a non-empty array' });
    }
    if (!body.callerService) {
      return res.status(400).json({ error: 'callerService is required' });
    }
    if (body.presenceCheck !== true) {
      return res.status(400).json({
        error: 'presenceCheck must be true — no swarm is invoked from anxiety',
        guidance: 'Caller must get still and affirm presence before invoking',
      });
    }

    const result = await executeInvocation({
      task: body.task,
      lenses: body.lenses,
      callerService: body.callerService,
      callerContext: body.callerContext,
      presenceCheck: true,
      templateName: null,
      model: body.model || 'gemma-e2b',
      synthesisStrategy: body.synthesisStrategy || 'discernment',
      synthesisModel: body.synthesisModel || 'qwen3-235b',
      agentTimeoutMs: body.timeout || parseInt(process.env.AGENT_TIMEOUT_MS || '180000', 10),
    });

    return res.json(result);
  } catch (error: any) {
    console.error('[Swarm Invoke] Error:', error);
    return res.status(500).json({ error: 'Swarm invocation failed', message: error.message });
  }
});

/**
 * POST /api/swarm/invoke-by-template
 *
 * Uses one of the seven canonical templates from the Standard Lens Library.
 */
router.post('/invoke-by-template', async (req: Request, res: Response) => {
  try {
    const body = req.body as SwarmInvokeByTemplateRequest;

    if (!body.templateName) {
      return res.status(400).json({ error: 'templateName is required' });
    }
    if (!body.task) {
      return res.status(400).json({ error: 'task is required' });
    }
    if (!body.callerService) {
      return res.status(400).json({ error: 'callerService is required' });
    }
    if (body.presenceCheck !== true) {
      return res.status(400).json({
        error: 'presenceCheck must be true — no swarm is invoked from anxiety',
        guidance: 'Caller must get still and affirm presence before invoking',
      });
    }

    const template = getTemplate(body.templateName);
    if (!template) {
      return res.status(404).json({
        error: `Template not found: ${body.templateName}`,
        available: listTemplates(),
      });
    }

    const result = await executeInvocation({
      task: body.task,
      lenses: template.lenses,
      callerService: body.callerService,
      callerContext: body.callerContext,
      presenceCheck: true,
      templateName: template.name,
      model: template.defaultModel,
      synthesisStrategy: template.defaultSynthesisStrategy,
      synthesisModel: template.defaultSynthesisModel,
      agentTimeoutMs: parseInt(process.env.AGENT_TIMEOUT_MS || '180000', 10),
    });

    return res.json(result);
  } catch (error: any) {
    console.error('[Swarm Invoke Template] Error:', error);
    return res.status(500).json({ error: 'Template swarm invocation failed', message: error.message });
  }
});

/**
 * GET /api/swarm/templates
 *
 * List available templates in the Standard Lens Library.
 */
router.get('/templates', (_req: Request, res: Response) => {
  return res.json({
    count: listTemplates().length,
    templates: getTemplateDetails(),
  });
});

/**
 * GET /api/swarm/history/:callerService
 *
 * Recent swarm invocations by a specific service.
 */
router.get('/history/:callerService', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, task, template_name, lens_count, model, synthesis_strategy,
              presence_check, started_at, completed_at, status, total_duration_ms, total_cost_tokens
       FROM swarm_invocations
       WHERE caller_service = $1
       ORDER BY started_at DESC
       LIMIT 50`,
      [req.params.callerService]
    );
    return res.json({ count: result.rows.length, invocations: result.rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/swarm/:id
 *
 * Full details of a specific swarm — invocation + signals + synthesis.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const invocation = await pool.query('SELECT * FROM swarm_invocations WHERE id = $1', [req.params.id]);
    if (invocation.rows.length === 0) {
      return res.status(404).json({ error: 'Swarm not found' });
    }
    const signals = await pool.query(
      'SELECT * FROM swarm_signals WHERE swarm_id = $1 ORDER BY created_at',
      [req.params.id]
    );
    const synthesis = await pool.query(
      'SELECT * FROM swarm_synthesis WHERE swarm_id = $1',
      [req.params.id]
    );
    return res.json({
      invocation: invocation.rows[0],
      signals: signals.rows,
      synthesis: synthesis.rows[0] || null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
