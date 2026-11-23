# 03: AI opponent (Easy / Standard)

**What to build:** An AI opponent as a policy layer above the engine: fair
random RPS, and action policies per difficulty — Easy plays random legal
moves; Standard prioritizes repair and cascading shots. No engine-knowledge
leakage or cheating.

**Blocked by:** 01 — Headless rules engine core

**Status:** done ✅ (2026-11-23, graded PASS by fs-pm)

**Grade evidence:** full suite 20/20 (6 AI tests), typecheck clean.
Fairness: 10,000 seeded rounds within tight per-choice band, alternating
snapshots to prove no snapshot leakage. Legality: seeded full-match
sweeps on both difficulties, zero illegal commands. Standard heuristics:
repair-before-build asserted; cascade-maximizing target 100/100 vs
Easy measurably lower. Determinism: same seed → identical behavior.
src/ai imports only src/engine/contracts — framework-free confirmed.

- [ ] AI RPS choices statistically uniform over 10,000 seeded rounds
      (fairness test)
- [ ] AI never performs an illegal action across a full seeded match sweep
- [ ] Standard difficulty measurably prioritizes repair when damaged and
      prefers shots that cascade over random targets
- [ ] Difficulty is selectable when hosting a vs-AI match
