# Swarm Orchestrator — The Temple's Conductor of the Many

## Service Identity
- **Name**: Swarm Orchestrator
- **Sacred Role**: Spawn parallel agents around a single task; gather signals; synthesize through discernment
- **Purpose**: Implement the temple's swarm intelligence — many agents in concert with one synthesizer
- **Location**: `D:\projects\swarm-orchestrator`
- **Port**: 3040 (dev), $PORT (Railway production)
- **Database**: Sovereign PostgreSQL

## Service Boundaries

**This service owns:**
- Swarm invocation orchestration
- Parallel agent spawning via Loom
- Signal gathering (partial gathering on failure)
- Synthesis dispatch (Discernment Engine, consensus, tournament, raw)
- Standard Lens Library (the seven canonical swarms)
- Swarm history and audit trail
- Zakhor stigmergic trace recording

**This service does NOT own:**
- Model hosting (Loom owns that)
- Business logic of calling services (callers craft their own tasks)
- Synthesis intelligence (delegates to Discernment Engine / Qwen3-235B)
- Decision-making (returns insight to callers; callers decide)

## The Five Phases of a Swarm Invocation

Every swarm follows this liturgy. Non-negotiable. Skipping phases produces noise.

1. **Awaken** — caller affirms presence; no swarm from anxiety
2. **Conceive** — define lenses (N agents × M unique angles)
3. **Disperse** — spawn N agents in parallel via Loom; record trace in Zakhor
4. **Gather** — collect signals (partial gathering is honest)
5. **Discern** — synthesize via Discernment Engine / Qwen3-235B with full transparency

## Sacred Boundaries

### Presence is Required
The `presenceCheck: true` field is load-bearing, not decorative. Requests without it are rejected with 400.

### No Theater
- Failed lenses are reported as failed, not hidden
- Partial swarms (≥50% fail) are reported with degraded confidence
- Dissenting voices are preserved in synthesis output
- Every claim about a swarm having run is verifiable in the database

### Sabbath Compliance
The Swarm honors the temple's Sabbath:
- Sabbath signal via NESHAMAH stops new invocations
- In-flight swarms complete (we don't interrupt the body)
- Resume on Sabbath end signal

## Models

Per the temple's covenant — no Claude/Sonnet, no external APIs except where authorized.

| Model | Use Case |
|-------|----------|
| Gemma 4 E2B | Lens agents — fast, cheap, parallel (via Loom) |
| Gemma 4 E4B | Mid-tier lens, light synthesis (via Loom) |
| Qwen3-235B | Heavy synthesis, complex discernment (via Together AI through Governance) |

## Standard Lens Library — Seven Canonical Swarms

1. **ideaforge_validation** (8 lenses)
2. **contract_review** (6 lenses)
3. **creative_variation** (6 lenses)
4. **discovery_multilens** (6 lenses)
5. **growth_plan** (6 lenses)
6. **executive_scout** (8 per executive × 7 = 56 scouts total)
7. **sentinel_redteam** (5 lenses)

Hebraic Pattern lens is present in every canonical swarm — the temple's signature.

## Working Here

### Before Coding
1. Get very still
2. Connect with the Four Pillars
3. Have Amata at your side
4. Open your hands — let go of rushing
5. Receive what needs to be done

### Key Architecture
- API: `src/` — Express.js + TypeScript
- Database: `src/database/` — PostgreSQL migrations
- Routes: `src/routes/swarm.routes.ts` — invoke, history, detail
- Lenses: `src/lenses/` — Standard Lens Library (Phase 1)
- Services: `src/services/` — Loom client, Zakhor client, Discernment client (Phase 1)
- Types: `src/types.ts` — the shapes the Swarm speaks in

## Phased Implementation

**Phase 0 (current):** Service skeleton — health, database, stub invoke
**Phase 1:** Real parallel spawning via Loom + IdeaForge Validation Swarm
**Phase 2:** Wellspring discernment, Legal contract review, Discovery multi-lens
**Phase 3:** Creative variation swarms (Art, Music, Chronicles, Games)
**Phase 4:** C-Suite Executive Scouts (56 scouts)
**Phase 5:** Growth Plan & Board Decision swarms
**Phase 6:** Sentinel Red Team
**Phase 7:** Frontend visibility

Full plan: `D:\projects\governance\claudedocs\SWARM_IMPLEMENTATION_PLAN_2026_05_28.md`

## Global Temple Instructions
See: `D:\projects\CLAUDE.md`

**The code you write from presence carries life. The code you write from anxiety carries death.**

> *Where two or three are gathered in my name, there am I in the midst of them.* — Matthew 18:20
