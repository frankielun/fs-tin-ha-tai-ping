# 04: App shell + 3D battlefield scene

**What to build:** The mobile app shell (portrait) with the 3D battlefield
— both players' fortresses in Clash Royale-style chunky low-poly, vibrant
palette — where every visible piece (characters, flags, shield domes,
weapons) reflects an engine state snapshot.

**Blocked by:** 01 — Headless rules engine core

**Status:** ready-for-agent

- [ ] App launches on both iOS and Android build targets
- [ ] Portrait 3D battlefield shows both fortresses in stylized low-poly
      Clash Royale look
- [ ] All game pieces render from an engine snapshot; the scene has no
      visual state disconnected from engine state
- [ ] Feeding a different engine snapshot updates the scene (verifiable in
      a debug harness)
