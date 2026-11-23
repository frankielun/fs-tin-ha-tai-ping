# 01: Headless rules engine core

**What to build:** The complete game rules as a pure, platform-agnostic
engine — 包剪揼 round loop, action legality, build phases (天下太平 4
characters → 3 flags → up to 5 shield layers → up to 3 weapons), and
win/lose resolution — demonstrated end-to-end by a scripted full match in a
text harness.

**Blocked by:** None (can start immediately; note the stack choice —
TypeScript vs C# — lands with the fs-architect sign-off before dispatch).

**Status:** ready-for-agent

- [ ] Scripted two-player match plays to completion in a text harness:
      4 characters, 3 flags, 5 shields, weapons deployed, one side wins
- [ ] Action legality enforced: build order chars → flags → shields →
      weapons; caps 4 / 3 / 5 / 3 respected; illegal actions unavailable
- [ ] Win/lose resolution: a player whose characters, flags, and shields
      are all destroyed loses; no rounds occur after match end
- [ ] Engine is pure logic: no rendering or framework imports; consumes
      player actions, exposes state snapshot + domain events (roundWon,
      pieceBuilt, matchOver, …)
- [ ] Unit tests cover the build-order legality matrix, caps, and
      win/lose resolution from external behavior only
