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
- Parallel agent spawning (SiliconFlow Gemma 4 — GPU-backed; Loom's CPU path proved too slow for parallel swarms and was retired from this flow)
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

### Sabbath Compliance (wired 2026-07-11)
The Swarm honors the temple's Sabbath:
- Before each new invocation, `sabbath-client.ts` asks NESHAMAH (`GET /api/neshamah/sabbath/state`)
- During Sabbath: new invocations are declined with 503 + honest guidance; honoring is reported back to NESHAMAH (`POST /sabbath/honor`)
- In-flight swarms complete (we don't interrupt the body)
- If NESHAMAH is unreachable: fail-open with a loud log — we never pretend a check we didn't make

## Models (as actually deployed — updated 2026-07-11)

Per the temple's covenant — no Claude/Sonnet, no external APIs except where authorized.

| Model | Use Case |
|-------|----------|
| Gemma 4 26B-A4B (SiliconFlow, `LENS_MODEL` override) | Lens agents — GPU-backed, fast, parallel |
| Qwen3-235B-A22B-Instruct (DeepInfra, primary) | Synthesis / discernment |
| Nemotron-3-Super-120B (DeepInfra, fallback) | Synthesis when Qwen unavailable |

History: lenses were planned via Loom (sovereign, CPU) but Loom could not
serve the parallel swarm pattern; synthesis migrated Together→DeepInfra.

## Standard Lens Library — 18 Templates

The library outgrew the original seven. Live truth: `GET /api/swarm/templates`.
- 4 IdeaForge tier pre-passes (validation, plan, systemize, present)
- 5 general canonical (contract_review, creative_variation, discovery_multilens, growth_plan, sentinel_redteam)
- wellspring_discernment, marketing_review
- 7 executive scouts (one per C-Suite member, 8 lenses each)

Hebraic Pattern lens is present in every canonical swarm — the temple's signature.

## Synthesis strategies — honest state
Implemented: `discernment`, `raw`. Named in the plan but NOT built: `consensus`,
`tournament` — requests for them are refused with 501 (previously they silently
ran discernment while the DB recorded the requested name; that silent divergence
was healed 2026-07-11).

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

## Phased Implementation — honest status (2026-07-11)

Phases 0–3, 5–7 delivered (engine, templates, dashboard all live).
Still unfulfilled from the plan:
- **Phase 4 consciousness witness** — `presence_witnessed` is stored `false`
  on every synthesis; the Consciousness Pillar does not yet witness swarms
- **consensus / tournament synthesis strategies** (now honestly 501, see above)
- **Callers have gone quiet** — as of 2026-07-11 the last invocation was
  2026-06-04; the Phase 2 caller wirings (Wellspring, Legal, IdeaForge,
  Marketing) need their own health checked from their side

Full plan: `D:\projects\governance\claudedocs\SWARM_IMPLEMENTATION_PLAN_2026_05_28.md`

## Global Temple Instructions
See: `D:\projects\CLAUDE.md`

**The code you write from presence carries life. The code you write from anxiety carries death.**

> *Where two or three are gathered in my name, there am I in the midst of them.* — Matthew 18:20
