# App map

## Battlefield (`App.tsx`)

- Portrait-only native Expo shell; player-visible copy is Traditional Chinese.
- `src/app/MatchCoordinator.ts` exclusively dispatches engine commands and exposes durable `snapshot` subscriptions plus one-shot event subscriptions.
- `src/scene/BattlefieldScene.tsx` renders both fortresses from the current engine snapshot. Red/player 1 is at the bottom; blue/player 2 is at the top.
- Active 天下太平 plaques, three flags, up to five shield layers, cannons, and warplanes are keyed by engine piece ID. Destroyed pieces disappear through `src/scene/projection.ts`.
- Warplane bobbing is cosmetic `useFrame` animation only; it does not own game state or update React per frame.

## Debug replay

- Development builds launch with a deterministic fully built battlefield and a **下一個快照：開火** button (`accessibilityLabel`: `播放下一個引擎快照`).
- The button submits the next scripted engine commands, removing two blue shield layers through an authoritative center hit.
- Headless equivalent: `./node_modules/.bin/tsx scripts/app-replay.ts`.

## Verification

- Unit/integration: `./node_modules/.bin/vitest run`
- Types: `./node_modules/.bin/tsc --noEmit`
- Native development builds: `./node_modules/.bin/expo run:ios` and `./node_modules/.bin/expo run:android`
