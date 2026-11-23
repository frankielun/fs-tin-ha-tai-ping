# Tin Ha Tai Ping (天下太平) — Game Rules Research

Status: research complete · Next: shape into idea.md → spec
Date: 2026-11-23

## 1 · What the game is

A Hong Kong classic paper-and-pencil classroom game (1970s–90s), also known as
飛機大砲 (Airplane Cannon). Two players each draw a fortress on paper and
progress through build phases gated by Rock-Paper-Scissors (包剪揼), then
fire weapons at each other's defenses until one side's characters, flags,
and shields are all destroyed.

## 2 · Sources

| # | Source | What it gives us |
|---|--------|------------------|
| 1 | [zh.wikipedia.org — 天下太平](https://zh.wikipedia.org/wiki/天下太平) | Canonical traditional rules summary; mainland variant; variant culture |
| 2 | [zh-yue.wikipedia.org — 天下太平](https://zh-yue.wikipedia.org/wiki/天下太平) | HK rules detail + prior commercial products (2010 iPhone app, Flash game) |
| 3 | [savraywim.com/guide](https://savraywim.com/guide?lang=en) — web remake rulebook | **Most complete modern ruleset**: firing skill minigame, damage cascade, repair, advanced weapons, house rules, game modes |
| 4 | [krispyre/fortress (GitHub)](https://github.com/krispyre/fortress) + [game_logic.md](https://raw.githubusercontent.com/krispyre/fortress/main/game_logic.md) | A digitized ruleset (tower 0–4 HP, shield stack, one-use bombs, async RPS) |
| 5 | [hk01 classroom games article](https://www.hk01.com/開罐/132598/集體回憶-東南西北摺情信-90後一定玩過的課室小遊戲) | Confirms classroom flow (4 grids, one char per RPS win) |
| 6 | [Baidu Baike — 天下太平 (游戏)](https://baike.baidu.com/item/天下太平/7843741) | Mainland variant: 16 strokes written stroke-by-stroke in a 田字格 |
| 7 | [GameNewsDaily coverage of the web remake](https://gamenewsdaily.net/童年紙筆遊戲重現-《天下太平》推出網頁版-香/) | Market proof: HK dev shipped a web version; features players asked for (custom weapons, matchmaking, 楚河漢界) |

## 3 · Traditional rules (canonical, cross-confirmed by sources 1, 2, 5)

1. **Setup**: each player draws a grid fortress on paper.
2. **Turn engine**: RPS each round; the winner takes one action.
3. **Build order (phases)**:
   - Write 「天下太平」 — one char per win (4 wins), or the stroke variant
     (one stroke per win, 16 total; mainland style)
   - Plant 3 flags (旗幟)
   - Build protection shields (保護罩/保護線), max 5 layers (house rule: 3)
   - Build weapons: cannons (大炮) and warplanes (戰機), max 3 per side
4. **Attacking**: fire weapons to destroy the opponent's shields, weapons,
   flags, then characters. Defender must win RPS rounds to repair/counter.
5. **Win condition**: a player loses when characters + flags + shields are
   all destroyed.

## 4 · Modern web remake rules (savraywim) — key mechanics worth stealing

- **楚河 (river)**: a river at the center blocks direct attacks until one
  side lands a hit on it — a natural "grace period" for the game's opening.
- **Firing is a skill minigame (射靶)**: pick weapon + target, a crosshair
  moves across the target, tap FIRE inside the bullseye. Distance shrinks
  the bullseye; cannons are accurate at close range, planes stable at long
  range. Bullseye = 1 dmg, dead-center = 2 dmg. **This is the hook our 3D
  animation hangs on.**
- **Damage cascade**: overflow damage flows river → outermost shield →
  nearest weapon → flags → characters (order 平、太、下、天).
- **HP table**: river/shield/flag/each character = 1 HP; cannon/plane = 1;
  custom weapon = 2; nuke = 3.
- **Repair**: after losing chars/flags/first shield, a won RPS round can be
  spent repairing in build order.
- **Advanced arsenal (late game, rounds 20/30/45+)**: 反彈網 reflector net
  (bounces a full attack back), 激光炮 laser (2 HP, auto-fire with charge
  turns), custom weapons (name + draw + choose attack power), 核武 nuke
  (3 HP, 5-round countdown, 7 dmg), 天氣輪盤 weather roulette (typhoon /
  rainstorm / thunderstorm / flood / fire / landslide debuffs).
- **House rules config**: chars-vs-strokes, 3-vs-5 shields, river on/off,
  draw-your-own vs preset domes.
- **Modes**: online rooms + matchmaking with AI fallback, vs computer
  (2 difficulties), pass-and-play (兩人同機), endgame puzzles (殘局),
  leaderboard.

## 5 · Prior digital versions (market scan)

- **天下太平大戰 (Tinha War)** — iPhone app by EC2 Hong Kong, 2010. Kept
  RPS mode, added story mode, XP/levels, player abilities (attack, HP,
  accuracy, evasion), special moves, obstacles, global leaderboard, photo-
  generated soldiers. Shows a "casual RPG overlay" direction. (Source 2.)
- **Web remake (thtp.savraywim.com)** — active 2026, HK-made; the deepest
  rules implementation; media coverage and player requests for custom
  weapons and matchmaking. (Sources 3, 7.)
- **krispyre/fortress** — hobby TS/Flask WebSocket multiplayer prototype;
  useful rules codification, unfinished graphics. (Source 4.)
- **yunimizxt/Tinhataiping** — GitHub app attempt, README only, no code.
  (Source: repo page.)

**Gap**: none of these is a polished native-feeling 3D mobile game.
Tinha War (2010) is dead; the web version is 2D and browser-bound.
A Clash-Royale-style 3D mobile remake with juicy destruction animation
is an open niche.

## 6 · Design takeaways for our build

1. Keep the **RPS-gated build loop** — it IS the game's identity.
2. The **target-shooting fire step** converts a coin-flip into skill and
   gives us the moment for 3D cannon fire + shield destruction animation.
3. **Damage cascade + repair** gives comeback mechanics; keep both.
4. MVP should be classic core (chars/flags/shields/cannons/planes + fire
   minigame + repair). River / advanced arsenal / weather = post-MVP
   content drops.
5. Modes: vs AI + pass-and-play first (no backend); online later.
6. Nostalgia is the emotional hook for HK players aged ~30–50; keep the
   paper-game vocabulary (天下太平, 保護罩, 大炮, 戰機, 楚河) in UI copy.
