# Spec — Tin Ha Tai Ping MVP

Status: awaiting user approval (spec & tickets gate)
Triage: ready-for-agent (pending approval)
Date: 2026-11-23
Parent idea: `idea.md` · Research: `game-rules-research.md`

## Problem Statement

天下太平 (Tin Ha Tai Ping) is a beloved Hong Kong paper-and-pencil classroom
game that survives only in memories. The one commercial mobile attempt died
in 2010, and the current web remake is 2D and browser-bound. Nostalgic HK
players have no way to play it on their phones — and no version exists with
the visual polish modern casual players expect.

## Solution

A cross-platform (iPhone + Android) 3D mobile remake that faithfully
preserves the original game's identity — the 包剪揼-gated build loop and the
satisfaction of shattering an opponent's shields — wrapped in Clash
Royale-style stylized 3D with juicy cannon-fire destruction animations.
MVP ships vs AI and pass-and-play; no backend.

## Testing seam

**One primary seam: the headless rules engine.** All game rules — RPS
rounds, build phases, fire resolution, damage cascade, repair, win/lose —
live in a pure, platform-agnostic engine module with no rendering or input
dependencies. It consumes player actions and emits game state + domain
events (e.g. `roundWon`, `shieldDestroyed`, `matchOver`). The 3D renderer,
UI, and AI sit above this seam, driven by engine events. Everything below
the seam is unit-testable without a device; everything above is verified by
fs-qa on device/emulator.

## User Stories

1. As a player, I want to throw 包剪揼 myself each round, so the game keeps
   the original hand-game tension.
   ACCEPTANCE: Given a round start, when I pick 包/剪/揼, then an exaggerated
   3D hand animation plays for both sides and the round winner is announced.
2. As a player, I want the RPS to be fair vs AI, so a loss is never
   suspicious.
   ACCEPTANCE: Given AI RPS choices, when sampled over 10,000 seeded rounds,
   then the distribution is statistically uniform and independent of my
   previous throws.
3. As a round winner, I want to write one character of 天下太平 per win, so
   the build-up feels like the classroom original.
   ACCEPTANCE: Given I have written N<4 characters and win a round, when I
   choose "write", then exactly one character is added in order 天→下→太→平.
4. As a round winner, I want to plant up to 3 flags after finishing the
   characters, so my fortress grows in the original order.
   ACCEPTANCE: Given 4 characters written and F<3 flags, when I win and
   choose "flag", then one flag is planted; choosing flags at F=3 is
   unavailable.
5. As a round winner, I want to raise up to 5 shield layers after flags, so
   I can protect my fortress.
   ACCEPTANCE: Given 3 flags and S<5 shields, when I win and choose "shield",
   then one layer is added; at S=5 the option is unavailable.
6. As a round winner, I want to deploy up to 3 weapons (cannons and/or
   warplanes), so I can attack.
   ACCEPTANCE: Given shields ≥1 and W<3 weapons, when I win and choose a
   weapon, then it appears in my arsenal; weapons cannot be built at W=3.
7. As a round winner, I want the action menu to only offer legal moves, so
   I never break the build order.
   ACCEPTANCE: Given any game state, when the action menu renders, then
   every offered action is legal in that state and every legal action is
   offered (build-order gating enforced).
8. As a player, I want to fire by landing a moving crosshair inside a
   bullseye, so shooting is a skill moment.
   ACCEPTANCE: Given I have ≥1 weapon and a legal target, when I open fire,
   then a crosshair sweeps the target; pressing FIRE inside the bullseye
   registers a hit (1 dmg), inside the center registers 2 dmg, and a miss
   does 0 dmg.
9. As a player, I want cannon vs warplane to feel different, so weapon
   choice matters.
   ACCEPTANCE: Given firing at long range, cannon bullseye is smaller than
   warplane bullseye; at close range, cannon bullseye is larger. (Accuracy
   profiles cross.)
10. As an attacker, I want overflow damage to cascade, so a strong shot
    feels devastating.
    ACCEPTANCE: Given a 2-dmg center hit destroys a 1-HP outer shield, when
    damage is applied, then the remaining 1 dmg flows to the next target in
    cascade order: shields (outermost first) → nearest weapon → flags →
    characters (平→太→下→天).
11. As a defender, I want flags/characters only targetable after shields
    and weapons are gone, so the original protection order holds.
    ACCEPTANCE: Given any state with shields or weapons remaining, when I
    view the target list, then flags and characters are not selectable.
12. As a damaged player, I want to spend a won round repairing, so comebacks
    are possible.
    ACCEPTANCE: Given my character/flag/first-shield was destroyed, when I
    win a round and choose "repair", then the earliest destroyed item in
    build order is restored.
13. As a player who lost everything, the match must end clearly.
    ACCEPTANCE: Given my characters, flags, and shields are all destroyed,
    when damage resolves, then a defeat screen shows immediately and no
    further rounds occur.
14. As a solo player, I want an AI opponent with Easy and Standard
    difficulty, so I can practice alone.
    ACCEPTANCE: Given a vs-AI match on either difficulty, when played to
    completion, then the AI obeys all legality rules; Standard prioritizes
    repair and cascading shots over random play.
15. As one of two friends sharing a phone, I want pass-and-play, so we can
    play like the old shared desk.
    ACCEPTANCE: Given pass-and-play mode, when a round ends, then the phone
    shows a hand-off prompt and hides the next player's RPS choice from the
    other (blind select, e.g. 3 hidden buttons or slide-over).
16. As a player, I want a 3D battlefield in Clash Royale style, so it looks
    like a modern game.
    ACCEPTANCE: Given any match, when viewed, then both fortresses render
    as chunky stylized 3D (low-poly, vibrant palette) with visible
    characters, flags, shield domes, and weapons matching engine state.
17. As a player, I want firing to feel spectacular, so destroying defenses
    is the best moment of the game.
    ACCEPTANCE: Given a hit, when the cannon fires, then a 3D projectile
    flies to the target and the shield/weapon shatters into particle debris
    with camera shake and sound; at ~60fps on a mid-range device.
18. As a Hong Kong player, I want Cantonese/Traditional Chinese UI copy with
    the original vocabulary, so it feels authentic.
    ACCEPTANCE: Given any screen, when read, then all copy is 繁體中文 using
    天下太平 / 保護罩 / 大炮 / 戰機 terminology.
19. As a new player, I want a one-screen rules recap, so I can learn in 30
    seconds.
    ACCEPTANCE: Given the rules screen, when opened, then it shows build
    order, fire minigame, and win condition with no scrolling walls of
    text.
20. As a player, I want a rematch button after each match, so replaying is
    one tap.
    ACCEPTANCE: Given a finished match, when I tap rematch, then a fresh
    match with the same mode/difficulty starts immediately.
21. As a player, I want the whole match to fit a 5–8 minute coffee break,
    so it matches the original's session length.
    ACCEPTANCE: Given average play, when a vs-AI match completes, then
    typical duration is 5–8 minutes (tuning knob: crosshair speed and
    round pacing).

## Implementation Decisions

- **Headless rules engine**: pure logic module, no framework imports; engine
  exposes state snapshot + event stream; all rule stories (1–14, 21) are
  testable against it directly.
- **Event-driven rendering**: the 3D layer subscribes to engine events to
  trigger animations (RPS reveal, projectile, shatter, victory).
- **AI = policy layer above the engine**: RPS is a fair random source;
  action policy differs by difficulty. No engine knowledge leakage.
- **Orientation**: portrait, single-hand friendly.
- **Stack**: decided at the architecture gate (react-three-fiber vs Unity
  comparison belongs to fs-architect). Spec is stack-agnostic; the engine
  seam must survive either choice (TypeScript/JS engine preferred if RN is
  chosen; C# if Unity — the engine contract is the same either way).
- **No backend, no accounts, no analytics** for MVP.
- **Fire minigame parameters** (crosshair speed, bullseye size curves by
  weapon/distance) are data-driven tunables, not hardcoded.
- Sound: small SFX set (RPS throw, cannon fire, shield shatter, win/lose
  sting); no music for MVP.

## Testing Decisions

- **Good test = external behavior only**: assert observable state/events,
  never internals. The engine is the one module with exhaustive unit
  coverage (full match simulations, damage-cascade permutations, legality
  matrix, AI fairness via seeded statistical test, repair ordering,
  win/lose resolution).
- **AI policy**: deterministic seeded tests for legality; heuristic checks
  for Standard difficulty behavior.
- **Above the seam**: fs-qa drives the real app on iOS simulator + Android
  emulator (Argent) — full match smoke, animation triggers, pass-and-play
  privacy hand-off, rules screen, rematch, and a 60fps spot-check.
- Prior art: none in-repo (greenfield); engine tests become the template.

## Out of Scope

楚河 river · house-rule configuration (chars-vs-strokes, 3-vs-5 shields) ·
laser cannon / reflector net / custom weapons / nuke / weather roulette ·
online multiplayer / matchmaking / leaderboard / accounts · story mode /
XP / abilities · English localization · music · tablet-optimized layouts ·
monetization.

## Further Notes

- Art north star: Clash Royale (chunky low-poly, saturated palette,
  exaggerated destruction). Research file has the market scan and the full
  modern rulebook we distilled rules from.
- The destruction of the outermost shield (保護罩) is the emotional core
  moment; juice budget concentrates there.
- Open product questions (non-blocking): App Store/Play Store release vs
  TestFlight-only for MVP; English name/branding.
