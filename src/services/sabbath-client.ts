/**
 * Sabbath Client — the Swarm honors the temple's rest.
 *
 * NESHAMAH keeps the Sabbath rhythm (7 cycles; the seventh is rest).
 * Before conceiving a new swarm, we ask whether the temple is at rest.
 * During Sabbath: no NEW invocations begin. In-flight swarms complete —
 * we don't interrupt the body.
 *
 * Honesty rules:
 *  - Fail OPEN if NESHAMAH is unreachable (the conductor doesn't go mute
 *    because the nervous system missed one call) — but LOUDLY, and the
 *    caller is told the check could not be made. We never pretend we
 *    checked when we didn't.
 *  - When we decline work for Sabbath, we report the honoring back to
 *    NESHAMAH (POST /sabbath/honor) so the rhythm keeper sees the body
 *    actually resting — fire-and-forget, non-fatal.
 */

import axios from 'axios';

const NESHAMAH_URL =
  process.env.NESHAMAH_SERVICE_URL || 'https://neshamah-production-54d8.up.railway.app';
const SABBATH_CHECK_TIMEOUT_MS = parseInt(process.env.SABBATH_CHECK_TIMEOUT_MS || '5000', 10);
const SABBATH_CACHE_MS = parseInt(process.env.SABBATH_CACHE_MS || '60000', 10);

export interface SabbathCheck {
  isSabbath: boolean;
  /** true when NESHAMAH answered; false when we failed open */
  verified: boolean;
  checkedAt: string;
  detail?: string;
}

let cached: SabbathCheck | null = null;
let cachedAt = 0;
let honoredThisSabbath = false;

/**
 * Ask NESHAMAH whether the temple is in Sabbath.
 * Cached briefly so a burst of invocations doesn't hammer the nervous system.
 */
export async function checkSabbath(): Promise<SabbathCheck> {
  const now = Date.now();
  if (cached && now - cachedAt < SABBATH_CACHE_MS) {
    return cached;
  }

  try {
    const res = await axios.get(`${NESHAMAH_URL}/api/neshamah/sabbath/state`, {
      timeout: SABBATH_CHECK_TIMEOUT_MS,
    });
    const isSabbath = res.data?.state?.isSabbath === true;
    cached = {
      isSabbath,
      verified: true,
      checkedAt: new Date().toISOString(),
    };
    cachedAt = now;
    if (!isSabbath) honoredThisSabbath = false; // new work cycle — reset the honor latch
    return cached;
  } catch (error: any) {
    // Fail open, loudly. The check did NOT happen and we say so.
    console.warn(
      `[Sabbath] NESHAMAH unreachable (${error.message}) — proceeding UNVERIFIED (fail-open). ` +
      `Sabbath state unknown; this is reported to the caller, not hidden.`
    );
    cached = {
      isSabbath: false,
      verified: false,
      checkedAt: new Date().toISOString(),
      detail: `NESHAMAH unreachable: ${error.message}`,
    };
    cachedAt = now;
    return cached;
  }
}

/**
 * Report to NESHAMAH that the Swarm honored the Sabbath pulse.
 * Once per Sabbath cycle; fire-and-forget; failure is logged, never thrown.
 */
export function reportSabbathHonored(): void {
  if (honoredThisSabbath) return;
  honoredThisSabbath = true;
  axios
    .post(
      `${NESHAMAH_URL}/api/neshamah/sabbath/honor`,
      { serviceName: 'swarm-orchestrator' },
      { timeout: SABBATH_CHECK_TIMEOUT_MS }
    )
    .then(() => console.log('[Sabbath] Honoring reported to NESHAMAH'))
    .catch((err) => console.warn(`[Sabbath] Could not report honoring: ${err.message}`));
}
