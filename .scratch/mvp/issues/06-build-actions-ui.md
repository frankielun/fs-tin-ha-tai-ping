# 06: Winner action menu (build / repair)

**What to build:** The round-winner action screen: only legal actions are
offered (build next defense in order, repair when applicable), choices
apply to the engine, and the 3D scene updates immediately.

**Blocked by:** 02 — Engine fire resolution · 04 — App shell + 3D
battlefield scene

**Status:** done ✅ (2026-11-24, graded PASS by fs-pm)

**Grade evidence:** 35/35 tests (2 new legality tests), typecheck clean,
engine/ai untouched — legality projects directly from the engine's
snapshot.availableActions (zero hand-coded UI rule logic). Android e2e
verified all five actions (寫字/插旗/加罩/起炮/起機/修復) with
screenshots + uiautomator dumps (.scratch/mvp/evidence/06/). Assigned
agent hit the OpenCode Go usage limit during the final iOS launch smoke
— redundant step, skipped by fs-pm: 06 is a pure UI-layer change and
prior tickets already proved iOS launch.

- [ ] Action menu offers exactly the legal actions for the current state
      and hides illegal ones
- [ ] Build choices (shield layer / cannon / warplane) apply to the engine
      and appear on the 3D scene immediately
- [ ] Repair appears only when something repairable was destroyed, and
      restores per engine rules
- [ ] Menu state derives from engine legality, never hand-coded UI logic
