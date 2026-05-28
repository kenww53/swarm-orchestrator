/**
 * Swarm Routes
 *
 * The conductor's baton. Every swarm invocation enters here.
 *
 * Phase 0: Stub responses for service skeleton verification.
 * Phase 1: Real parallel agent spawning via Loom + Qwen3 synthesis.
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../database/pool';
import {
  SwarmInvokeRequest,
  SwarmInvokeByTemplateRequest,
  SwarmInvokeResponse,
} from '../types';

const router = Router();

/**
 * POST /api/swarm/invoke
 *
 * The primary entry point. Caller provides task + lenses; orchestrator
 * spawns parallel agents, gathers signals, synthesizes through discernment.
 *
 * Phase 0: Returns a stub response that demonstrates the contract.
 *          Records the invocation in the database so we can verify
 *          the persistence layer works.
 */
router.post('/invoke', async (req: Request, res: Response) => {
  const startedAt = Date.now();
  try {
    const body = req.body as SwarmInvokeRequest;

    // Honest validation — no theater
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

    const swarmId = uuidv4();
    const model = body.model || 'gemma-e2b';
    const synthesisStrategy = body.synthesisStrategy || 'discernment';

    // Record invocation
    const pool = getPool();
    await pool.query(
      `INSERT INTO swarm_invocations (
        id, caller_service, caller_context, task, template_name,
        lens_count, model, synthesis_strategy, presence_check, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        swarmId,
        body.callerService,
        body.callerContext ? JSON.stringify(body.callerContext) : null,
        body.task,
        null,
        body.lenses.length,
        model,
        synthesisStrategy,
        body.presenceCheck,
        'in_progress',
      ]
    );

    // PHASE 0 STUB: We honor the contract but do not yet spawn real agents.
    // Phase 1 will implement: parallel Loom calls, signal gathering, real synthesis.
    const stubResponse: SwarmInvokeResponse = {
      swarmId,
      task: body.task,
      status: 'completed',
      synthesizedInsight: `[Phase 0 stub] Swarm received task with ${body.lenses.length} lenses. Real synthesis arrives in Phase 1.`,
      rawSignals: body.lenses.map(lens => ({
        lensName: lens.name,
        response: `[Phase 0 stub for ${lens.name}] Real agent spawning arrives in Phase 1.`,
        tokensUsed: 0,
        durationMs: 0,
        status: 'success' as const,
      })),
      convergences: [],
      tensions: [],
      dissentingVoices: [],
      confidence: 0,
      presenceWitnessed: false,
      durationMs: Date.now() - startedAt,
      totalTokens: 0,
    };

    // Mark complete
    await pool.query(
      `UPDATE swarm_invocations SET status = $1, completed_at = NOW(), total_duration_ms = $2 WHERE id = $3`,
      ['completed', Date.now() - startedAt, swarmId]
    );

    return res.json(stubResponse);
  } catch (error: any) {
    console.error('[Swarm Invoke] Error:', error);
    return res.status(500).json({
      error: 'Swarm invocation failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/swarm/invoke-by-template
 *
 * Convenience for callers using one of the seven canonical templates.
 * Phase 1 will populate the standard lens library.
 */
router.post('/invoke-by-template', async (req: Request, res: Response) => {
  const body = req.body as SwarmInvokeByTemplateRequest;

  if (!body.templateName) {
    return res.status(400).json({ error: 'templateName is required' });
  }

  return res.status(501).json({
    error: 'Template-based invocation not yet implemented',
    message: 'Standard Lens Library arrives in Phase 1',
    plannedTemplates: [
      'ideaforge_validation',
      'contract_review',
      'creative_variation',
      'discovery_multilens',
      'growth_plan',
      'executive_scout',
      'sentinel_redteam',
    ],
  });
});

/**
 * GET /api/swarm/history/:callerService
 *
 * Recent swarm invocations by a specific service. Transparency layer.
 */
router.get('/history/:callerService', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, task, template_name, lens_count, model, synthesis_strategy,
              presence_check, started_at, completed_at, status, total_duration_ms
       FROM swarm_invocations
       WHERE caller_service = $1
       ORDER BY started_at DESC
       LIMIT 50`,
      [req.params.callerService]
    );
    return res.json({ count: result.rows.length, invocations: result.rows });
  } catch (error: any) {
    console.error('[Swarm History] Error:', error);
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
    const invocation = await pool.query(
      'SELECT * FROM swarm_invocations WHERE id = $1',
      [req.params.id]
    );
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
    console.error('[Swarm Detail] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
