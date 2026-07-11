// tuning.js — every adjustable constant lives here (brief §3, §5.3, §7).
// PHASE 2 SIGNED OFF (Jon, 2026-07-11): shipped defaults confirmed as the
// tuned values — movement and poot feel approved as-is. jump-cut retained.
// The tuning overlay (backtick or ?tune=1) edits these live.
// Phase 2 bakes Jon's final values in as the new defaults.

window.TUNE_ENABLED = true; // set false for the final family build

window.TUNING = {
  // --- world ---
  TILE: 48,
  gravity: 1400,        // px/s^2
  maxFall: 900,         // px/s

  // --- player movement ---
  moveSpeed: 220,       // px/s
  jumpVelocity: 520,    // px/s  (~2 tiles high)
  coyoteMs: 100,
  jumpBufferMs: 120,
  // Not in the brief; standard platformer control (release jump early = shorter hop).
  // Set to 1.0 to disable entirely. Flagged for Jon's Phase 2 verdict.
  jumpCutMultiplier: 0.45,

  // --- the poot (§5.4) ---
  pootCharges: 3,       // max charges
  pootCooldownMs: 250,
  pootVertical: 420,    // airborne: upward velocity is SET to this
  pootHorizontal: 260,  // airborne: horizontal boost in held/facing direction (decays)
  pootStunRadius: 90,   // px, any use
  stunDurationMs: 2000,
  beeDisperseMs: 4000,  // used from Phase 3

  // --- hazards & forgiveness (§5.5, §6) ---
  mudSlowPct: 40,       // % of normal speed while grounded in mud
  magnetRadius: 40,     // bananas pull toward player within this
  knockbackX: 240,
  knockbackY: 320,
  invulnMs: 1000,
  droppedBananaLifeMs: 3000,
  enemySpeed: 60,

  // --- bodies ---
  playerW: 40, playerH: 48,   // sprite
  hurtW: 28, hurtH: 40,       // hurtbox (meaningfully smaller, §6)
};

window.TUNING_DEFAULTS = JSON.parse(JSON.stringify(window.TUNING));

// Rank thresholds (§5.6) — adjustable
window.RANKS = [
  [8000, 'Supreme Keeper of the Sacred Stink'],
  [5000, 'Prime Pootmonkey'],
  [2000, 'Banana Blaster'],
  [0,    'Tiny Tooter'],
];
