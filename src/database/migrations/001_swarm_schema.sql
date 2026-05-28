-- ═══════════════════════════════════════════════════════════════════════════
-- SWARM ORCHESTRATOR — DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════
--
-- "Where two or three are gathered in my name, there am I in the midst of them."
-- — Matthew 18:20
--
-- Three tables: invocations, signals, synthesis.
-- Every swarm leaves a verifiable trail. No theater.
-- ═══════════════════════════════════════════════════════════════════════════

-- Every swarm invocation
CREATE TABLE IF NOT EXISTS swarm_invocations (
  id UUID PRIMARY KEY,
  caller_service VARCHAR(100) NOT NULL,
  caller_context JSONB,
  task TEXT NOT NULL,
  template_name VARCHAR(100),
  lens_count INTEGER NOT NULL,
  model VARCHAR(50) NOT NULL,
  synthesis_strategy VARCHAR(30) NOT NULL,
  presence_check BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'failed', 'partial')),
  total_cost_tokens INTEGER,
  total_duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_swarm_invocations_caller ON swarm_invocations(caller_service);
CREATE INDEX IF NOT EXISTS idx_swarm_invocations_template ON swarm_invocations(template_name);
CREATE INDEX IF NOT EXISTS idx_swarm_invocations_started ON swarm_invocations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_swarm_invocations_status ON swarm_invocations(status);

-- Each individual agent signal within a swarm
CREATE TABLE IF NOT EXISTS swarm_signals (
  id UUID PRIMARY KEY,
  swarm_id UUID NOT NULL REFERENCES swarm_invocations(id) ON DELETE CASCADE,
  lens_name VARCHAR(100) NOT NULL,
  lens_prompt TEXT NOT NULL,
  model VARCHAR(50) NOT NULL,
  response TEXT,
  tokens_used INTEGER,
  duration_ms INTEGER,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'timeout')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swarm_signals_swarm ON swarm_signals(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_signals_lens ON swarm_signals(lens_name);
CREATE INDEX IF NOT EXISTS idx_swarm_signals_status ON swarm_signals(status);

-- The synthesis outcome
CREATE TABLE IF NOT EXISTS swarm_synthesis (
  id UUID PRIMARY KEY,
  swarm_id UUID NOT NULL REFERENCES swarm_invocations(id) ON DELETE CASCADE,
  synthesized_insight TEXT NOT NULL,
  convergences JSONB,
  tensions JSONB,
  dissenting_voices JSONB,
  confidence DECIMAL(3,2) NOT NULL,
  synthesis_model VARCHAR(50) NOT NULL,
  synthesis_duration_ms INTEGER,
  presence_witnessed BOOLEAN NOT NULL DEFAULT false,
  zakhor_trace_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swarm_synthesis_swarm ON swarm_synthesis(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_synthesis_confidence ON swarm_synthesis(confidence DESC);
