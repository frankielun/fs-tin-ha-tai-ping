# 02: Engine fire resolution, damage cascade, repair

**What to build:** Fire resolution inside the rules engine: target
legality, hit/center/miss damage (1 / 2 / 0), overflow cascade
(shields outermost-first → nearest weapon → flags → characters in order
平→太→下→天), and repair ordering.

**Blocked by:** 01 — Headless rules engine core

**Status:** ready-for-agent

- [ ] A 2-dmg center hit that destroys a 1-HP shield applies the remaining
      1 dmg to the next target in cascade order
- [ ] Flags and characters are not targetable while any shield or weapon
      remains on the defender
- [ ] Repair restores the earliest destroyed item in build order and is
      only offered when something repairable was destroyed
- [ ] Miss (0 dmg) consumes the shot with no state change beyond round
      advancement
- [ ] Unit tests cover cascade permutations, target legality, and repair
      ordering
