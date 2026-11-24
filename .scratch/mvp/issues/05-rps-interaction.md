# 05: 包剪揼 interaction screen with 3D hands

**What to build:** The round-opening RPS screen: player personally picks
包/剪/揼, an exaggerated 3D hand animation plays for both sides, the round
winner is announced, and draws replay the round. Wired to the engine round
loop.

**Blocked by:** 04 — App shell + 3D battlefield scene

**Status:** done ✅ (2026-11-24, graded PASS by fs-pm)

**Grade evidence:** 33/33 tests (7 new), typecheck clean, engine/ai
diff empty. Android e2e verified: uiautomator + adb taps through 5+
rounds — draws auto-replayed, player-win showed the ticket-06
placeholder, AI-win advanced the round counter and built the 天 plaque
(screenshots + XML dumps in .scratch/mvp/evidence/05/). iOS
launch smoke OK (GL-blank-on-sim = documented limitation).

- [ ] Player picks 包/剪/揼 each round via tap/gesture
- [ ] Exaggerated 3D hand animation plays for both sides before reveal
- [ ] Round winner announcement transitions into the winner-acts phase
- [ ] Draw replays the round automatically
- [ ] Screen driven by engine round events, not local UI state
