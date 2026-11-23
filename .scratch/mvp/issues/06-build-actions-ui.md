# 06: Winner action menu (build / repair)

**What to build:** The round-winner action screen: only legal actions are
offered (build next defense in order, repair when applicable), choices
apply to the engine, and the 3D scene updates immediately.

**Blocked by:** 02 — Engine fire resolution · 04 — App shell + 3D
battlefield scene

**Status:** ready-for-agent

- [ ] Action menu offers exactly the legal actions for the current state
      and hides illegal ones
- [ ] Build choices (shield layer / cannon / warplane) apply to the engine
      and appear on the 3D scene immediately
- [ ] Repair appears only when something repairable was destroyed, and
      restores per engine rules
- [ ] Menu state derives from engine legality, never hand-coded UI logic
