# 11: Device QA + performance validation

**What to build:** The formal QA pass: fs-qa drives the finished app on iOS
simulator and Android emulator via Argent — full-match smoke on both AI
difficulties and pass-and-play, fire-sequence framerate spot checks, and
pass-and-play privacy verification. Findings become issues; criticals block
the ship gate.

**Blocked by:** 08 — Pass-and-play · 09 — Match flow screens · 10 — Sound
effects + juice polish

**Status:** ready-for-agent

- [ ] Full-match smoke passes on iOS simulator and Android emulator: vs AI
      (both difficulties) and pass-and-play
- [ ] Fire/shatter sequences hold ~60fps on target devices (spot-checked,
      documented)
- [ ] Pass-and-play privacy verified: no choice leakage at hand-off
- [ ] All findings logged as issues with severity; zero criticals open
      before the ship gate
