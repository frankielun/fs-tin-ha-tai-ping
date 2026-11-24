# App map

## Battlefield (`App.tsx`)

- Portrait-only native Expo shell; player-visible copy is Traditional Chinese.
- `src/app/MatchCoordinator.ts` exclusively dispatches engine commands and exposes durable `snapshot` subscriptions plus one-shot event subscriptions.
- `src/scene/BattlefieldScene.tsx` renders both fortresses from the current engine snapshot. Red/player 1 is at the bottom; blue/player 2 is at the top.
- Active 天下太平 plaques, three flags, up to five shield layers, cannons, and warplanes are keyed by engine piece ID. Destroyed pieces disappear through `src/scene/projection.ts`.
- Warplane bobbing is cosmetic `useFrame` animation only; it does not own game state or update React per frame.

## Interactive vs-AI rounds

- Normal launches start an Easy vs-AI match. `src/app/VsAiMatchController.ts` sends player 包/剪/揼 input and seeded AI decisions through `MatchCoordinator`; after an AI win it immediately submits the AI build/fire command.
- The three input buttons use test IDs `rps-paper`, `rps-scissors`, and `rps-rock`, with accessibility labels `出包`, `出剪`, and `出揼`.
- `rpsResolved` starts the ephemeral two-hand animation and delayed winner banner. Draws return to RPS input after the animation; a player win leaves the engine in its action phase with the ticket-06 placeholder caption.
- `src/scene/RpsHands.tsx` maps revealed choices to low-poly palm, fist, and prong meshes. Movement, pulse, and dissolve use `useFrame` plus mutable Three refs/materials only; durable pieces still reconcile solely from snapshots.

## Debug replay

- QA can render `BattlefieldApp debug` to launch the deterministic fully built battlefield and a **下一個快照：開火** button (`accessibilityLabel`: `播放下一個引擎快照`). Normal development and production launches use the real match loop.
- The button submits the next scripted engine commands, removing two blue shield layers through an authoritative center hit.
- Headless equivalent: `./node_modules/.bin/tsx scripts/app-replay.ts`.

## Verification

- Unit/integration: `./node_modules/.bin/vitest run`
- Types: `./node_modules/.bin/tsc --noEmit`
- Native development builds: `./node_modules/.bin/expo run:ios` and `./node_modules/.bin/expo run:android`
