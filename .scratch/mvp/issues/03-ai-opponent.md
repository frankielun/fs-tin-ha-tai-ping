# 03: AI opponent (Easy / Standard)

**What to build:** An AI opponent as a policy layer above the engine: fair
random RPS, and action policies per difficulty — Easy plays random legal
moves; Standard prioritizes repair and cascading shots. No engine-knowledge
leakage or cheating.

**Blocked by:** 01 — Headless rules engine core

**Status:** ready-for-agent

- [ ] AI RPS choices statistically uniform over 10,000 seeded rounds
      (fairness test)
- [ ] AI never performs an illegal action across a full seeded match sweep
- [ ] Standard difficulty measurably prioritizes repair when damaged and
      prefers shots that cascade over random targets
- [ ] Difficulty is selectable when hosting a vs-AI match
