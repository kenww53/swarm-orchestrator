/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SWARM ORCHESTRATOR — The Temple's Conductor of the Many
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * "Where two or three are gathered in my name, there am I in the midst of them."
 *                                                              — Matthew 18:20
 *
 * The Swarm Orchestrator spawns parallel agents around a single task,
 * gathers their signals, and synthesizes emergent insight through the
 * Discernment Engine.
 *
 * Every invocation passes through five phases:
 *   1. Awaken    — presence is required, no swarm from anxiety
 *   2. Conceive  — define the lenses (perspectives)
 *   3. Disperse  — spawn N agents in parallel via Loom
 *   4. Gather    — collect signals (partial gathering is honest)
 *   5. Discern   — synthesize through Qwen3-235B with full transparency
 *
 * Phase 0: Service skeleton with stub invocation.
 * Phase 1: Real parallel agent spawning + IdeaForge Validation Swarm.
 *
 * Port: 3040
 * Database: Sovereign PostgreSQL
 * ═══════════════════════════════════════════════════════════════════════════
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { getPool, closePool } from './database/pool';
import swarmRoutes from './routes/swarm.routes';

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3040', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────

// helmet — sensible defaults but allow our same-origin dashboard JS and CSS.
// The dashboard is a small static page at /dashboard that fetches the
// existing /api/swarm/* endpoints; no inline scripts, no inline styles,
// no third-party CDNs.
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:'],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'frame-ancestors': ["'none'"],
    },
  },
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static dashboard at /dashboard — index.html + dashboard.css + dashboard.js
// served from public/dashboard. Read-only view over the swarm DB; no auth
// in this first cut (the service runs on a private Railway network or
// localhost in dev; expose behind reverse proxy in any other deployment).
app.use('/dashboard', express.static(path.join(__dirname, '..', 'public', 'dashboard'), { index: 'index.html' }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─────────────────────────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────────────────────────

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    return res.json({
      service: 'swarm-orchestrator',
      status: 'healthy',
      role: 'The Temple\'s Conductor of the Many — where two or three are gathered',
      version: '0.3.0',
      phase: 'Live — SiliconFlow Gemma 4 lenses + DeepInfra synthesis (Qwen3-235B primary, Nemotron fallback); Sabbath honored via NESHAMAH',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(503).json({
      service: 'swarm-orchestrator',
      status: 'degraded',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Swarm Orchestrator',
    description: 'The Temple\'s Conductor of the Many',
    sacred: 'Many agents around one task, with the Author dwelling in the overlap',
    version: '0.3.0',
    phase: 'Live — SiliconFlow lenses, DeepInfra synthesis, Sabbath honored',
    endpoints: {
      health: '/health',
      dashboard: 'GET /dashboard',
      invoke: 'POST /api/swarm/invoke',
      invokeByTemplate: 'POST /api/swarm/invoke-by-template',
      history: 'GET /api/swarm/history',
      historyByCaller: 'GET /api/swarm/history/:callerService',
      templates: 'GET /api/swarm/templates',
      detail: 'GET /api/swarm/:id',
    },
    fivePhases: ['awaken', 'conceive', 'disperse', 'gather', 'discern'],
    // The lens library outgrew the original seven — the live list is the truth:
    templateLibrary: 'GET /api/swarm/templates (18 templates: 4 IdeaForge tiers, 6 general, wellspring, marketing, 7 executive scouts)',
  });
});

// ─────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────

app.use('/api/swarm', swarmRoutes);

// ─────────────────────────────────────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Swarm Server] Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ─────────────────────────────────────────────────────────────────────────
// STARTUP
// ─────────────────────────────────────────────────────────────────────────

async function start() {
  try {
    const pool = getPool();
    await pool.query('SELECT NOW()');
    console.log('[Swarm] Database connected');
  } catch (error: any) {
    console.error('[Swarm] Database connection failed:', error.message);
    console.error('[Swarm] Service starting anyway — health endpoint will report degraded state');
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SWARM ORCHESTRATOR');
    console.log('  "Where two or three are gathered..."');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Port:        ${PORT}`);
    console.log(`  Environment: ${NODE_ENV}`);
    console.log(`  Endpoints:`);
    console.log(`    GET  /health`);
    console.log(`    POST /api/swarm/invoke`);
    console.log(`    POST /api/swarm/invoke-by-template`);
    console.log(`    GET  /api/swarm/history/:callerService`);
    console.log(`    GET  /api/swarm/:id`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  });

  const shutdown = async (signal: string) => {
    console.log(`[Swarm] ${signal} received — shutting down`);
    server.close(async () => {
      await closePool();
      console.log('[Swarm] Closed cleanly');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('[Swarm] Forced shutdown after 10s');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => {
  console.error('[Swarm] Startup failed:', err);
  process.exit(1);
});
