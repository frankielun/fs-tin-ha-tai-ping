# R3F release performance spike

This is a throwaway Expo app. It is intentionally isolated under
`.scratch/mvp/spike-r3f/`; it must not be imported by `src/` or the root
package manifest.

## What it exercises

- Portrait Expo app using Expo SDK 54 / New Architecture.
- `@react-three/fiber/native` over `expo-gl`.
- Chunky low-poly fortress, wireframe shield dome, pooled projectile meshes.
- Four pooled bursts with 192 total instanced particles.
- Ten-second repeated fire/shatter loop.
- FPS/frame-time overlay. JS heap is shown only where the runtime exposes
  `performance.memory`; native process memory must be captured by platform
  tools.

## Install and static checks

```sh
npm install
npm run typecheck
npm run bundle:ios
npm run bundle:android
```

The two `expo export` commands verify Metro can resolve both platform
bundles. They are not native release builds and do not measure GL performance.

## Native release procedure

On a provisioned bench, build and launch the native release targets:

```sh
npx expo prebuild --clean
npx expo run:ios --configuration Release
npx expo run:android --variant release
```

Do not use Expo Go, remote debugging, or a debug build. For each target, start
the app, let it settle for 2 seconds, run the complete 10-second loop, and
capture:

- FPS and frame-time distribution from the overlay plus native profiler;
- peak process memory from Instruments Allocations (iOS) or
  `adb shell dumpsys meminfo <package>` (Android);
- device/emulator model, OS/API, build configuration, and thermal state.

The ADR gate is >=55 FPS and <=250 MB peak memory on both floor devices. The
simulator/emulator runs are directional; fs-qa must repeat on a physical
iPhone 11/A13-class and Pixel 6a-class device before declaring the renderer
unblocked.

### Attempt log (2026-11-23)

- `npm run typecheck`: passed.
- `npm run bundle:ios`: passed; Hermes bundle generated (4.29 MB).
- `npm run bundle:android`: passed; Hermes bundle generated (4.30 MB).
- `npx expo-doctor`: passed, 18/18 checks, after pinning Jest 29.7.0.
- iOS `xcodebuild` Release simulator build: passed; iPhone 17 simulator
  launched the complete loop at 60.0 FPS average, 16.95 ms p95 frame time,
  and 214.0 MB peak dirty native VM.
- Android `./gradlew assembleRelease`: passed; release variant installed with
  its generated debug keystore. The API 37 emulator completed the loop at
  22.2 FPS average, 88.35 ms p95 frame time, and 79.8 MB peak PSS
  (209.1 MB RSS).
- The Android emulator used software GLES (lavapipe/SwANGLE), so the result is
  a proxy finding and still fails the hard 55 FPS gate. Physical iPhone
  11-class/Pixel 6a-class verification remains ticket 11.
