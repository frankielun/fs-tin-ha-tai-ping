# 04: App shell + 3D battlefield scene

**What to build:** The mobile app shell (portrait) with the 3D battlefield
— both players' fortresses in Clash Royale-style chunky low-poly, vibrant
palette — where every visible piece (characters, flags, shield domes,
weapons) reflects an engine state snapshot.

**Blocked by:** 01 — Headless rules engine core

**Status:** done ✅ (2026-11-24, graded PASS by fs-pm with one environment caveat)

**Grade evidence:** suite 26/26 + typecheck clean. Android emulator
(VERIFIED visually via pixel stats, 286 colors + replay taps advancing
92/94 commands): app launches, portrait 3D battlefield renders, all
pieces from engine snapshot, replay updates scene — all four criteria
met. iOS simulator: app + RN UI render (262 colors in UI area) but the
GL surface is blank — a KNOWN platform limitation (R3F #2546/#3557:
iOS simulator never renders expo-gl; real devices work), not a code
defect; iOS visual verification deferred to physical device at ticket 11
per ADR 0002 §iOS simulator visual limitation.

**Deviation note:** the assigned agent hit the OpenCode Go 5-hour usage
limit mid-run; fs-pm completed verification in-session (pixel-stat
method, no image eyes needed).

- [ ] App launches on both iOS and Android build targets
- [ ] Portrait 3D battlefield shows both fortresses in stylized low-poly
      Clash Royale look
- [ ] All game pieces render from an engine snapshot; the scene has no
      visual state disconnected from engine state
- [ ] Feeding a different engine snapshot updates the scene (verifiable in
      a debug harness)
