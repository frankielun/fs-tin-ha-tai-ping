# Idea — Tin Ha Tai Ping MVP

Status: awaiting user approval (intake gate)
Date: 2026-11-23

## One-liner

A 3D mobile remake of the classic Hong Kong paper-and-pencil classroom game
天下太平 (Tin Ha Tai Ping), with Clash Royale-style visuals and juicy
cannon-fire shield-destruction animations.

## Restatement

Two players (or one player vs AI) relive the 1970s–90s HK classroom game:
every round starts with 包剪揼 (rock-paper-scissors) which the player throws
personally; the winner takes one action — build (write 天下太平 → plant 3
flags → raise up to 5 shield layers → deploy cannons/warplanes), fire, or
repair. Firing is a target-shooting minigame: pick a weapon and a target,
land the moving crosshair in the bullseye, and watch a Clash Royale-style 3D
cannon blast shatter the opponent's shields. When a player's characters,
flags, and shields are all destroyed, they lose.

## Users

- **Primary**: HK nostalgic adults (~30–50) who played this in class during
  the 70s–90s; Cantonese diaspora.
- **Secondary**: casual mobile gamers; kids/parents learning the classic.

## Platform

iPhone + Android. Single codebase preferred; final stack decided by
fs-architect at the architecture gate.

## Core loop

1. **RPS round** — player physically picks 包/剪/揼; exaggerated 3D hand
   animation vs AI (or the pass-and-play opponent).
2. **Winner acts** — build next defense in order, fire, or repair.
3. **Fire = target shooting** — choose weapon + target; moving crosshair;
   tap inside the bullseye. Bullseye = 1 dmg, dead-center = 2 dmg; distance
   shrinks the target; cannon accurate at close range, warplane steadier at
   long range. **This is the juice moment: 3D cannon fire + shield
   shattering with particles.**
4. **Damage cascade** — overflow flows: shields (outermost first) → nearest
   weapon → flags → characters (order 平、太、下、天).
5. **Repair** — a won round can restore destroyed chars/flags/first shield
   in build order.
6. **Win** — opponent's characters + flags + shields all gone.

## MVP scope (in)

- Classic rules: 4 characters (one per won round), 3 flags, 5 shield
  layers, cannons + warplanes (max 3 per side), fire minigame with damage
  cascade, repair.
- Modes: **vs AI** (2 difficulties) + **pass-and-play on one device**
  (兩人同機, like the old shared-desk game).
- RPS: player throws personally each round.
- Art: pure Clash Royale style — chunky stylized low-poly 3D, vibrant
  palette, particle destruction. Reference: Clash Royale.
- UI copy in written Cantonese / 繁體中文 using the original vocabulary
  (天下太平、保護罩、大炮、戰機).
- Core sound effects: RPS throw, cannon fire, shield shatter, victory/defeat.

## Non-goals (post-MVP backlog)

- 楚河 river + house-rule configuration (chars-vs-strokes, 3-vs-5 shields).
- Advanced arsenal: laser cannon, reflector net, custom weapons, nuke,
  weather roulette.
- Online multiplayer, matchmaking, leaderboard (needs backend).
- Story mode / XP / abilities (the 2010 Tinha War direction).
- English localization.

## Success criteria

- Full match playable end-to-end vs AI on a physical iPhone and Android
  device.
- Fire/destruction animations hold ~60fps on mid-range devices.
- A 5–8 minute match recreates the classroom feeling: RPS tension + the
  satisfaction of breaking shields.
- Pass-and-play works smoothly on one phone.

## Constraints & decisions log

| Decision | Choice | Rationale |
|---|---|---|
| Rule scope | Classic core + fire minigame | Authentic identity; skill moment; advanced stuff = content drops |
| Modes | vs AI + pass-and-play | No backend; fastest to real devices |
| RPS | Player throws personally | Game feel; the game IS RPS-gated |
| Art | Pure Clash Royale style | User preference (no paper-nostalgia hybrid for MVP) |
| Tech stack | Expo React Native + TypeScript + react-three-fiber | fs-architect ADR 0001, signed 2026-11-23; Unity = fallback per kill criterion |
| Backend | None for MVP | AI + local play only |
| Min OS floor | iOS 15+ / Android API 26+ | Architect proposal, user-confirmed 2026-11-23; matches current Expo SDK |
| MVP release channel | TestFlight / Play internal testing only | User-confirmed 2026-11-23; public store review deferred to ship stage |

## Open questions (non-blocking)

- Sound/music: library vs original composition.
- App Store / Play Store release for MVP, or TestFlight/internal only?
- Branding/name: 天下太平 English name (e.g. "Tin Ha Tai Ping")?

## Research

See `game-rules-research.md` (same folder) — 7 cited sources covering
traditional rules, the active HK web remake's full rulebook, and prior
digital attempts.
