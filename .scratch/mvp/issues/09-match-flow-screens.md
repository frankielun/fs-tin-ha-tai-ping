# 09: Match flow screens (win/lose, rematch, rules, mode select)

**What to build:** Complete match flow: start screen with mode + difficulty
selection (vs AI Easy/Standard, pass-and-play), victory/defeat screens at
match end, one-tap rematch with the same settings, and a one-screen 繁中
rules recap readable in 30 seconds.

**Blocked by:** 07 — 射靶 fire minigame + 3D cannon destruction

**Status:** ready-for-agent

- [ ] Start screen selects mode and AI difficulty; selection persists into
      the match
- [ ] Match end shows victory/defeat immediately when the engine emits
      matchOver; no further input accepted
- [ ] Rematch starts a fresh match with the same mode/difficulty in one tap
- [ ] Rules screen in 繁體中文 covers build order, fire minigame, and win
      condition on a single screen
