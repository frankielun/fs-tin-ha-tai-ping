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

The host used for the spike did not have `xcrun simctl`, `adb`, or
`emulator`, so the native runs are pending. On a provisioned bench:

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
- `npx expo run:ios --configuration Release`: native project and Pods
  generated, then stopped because Xcode/simctl is not installed/selected.
- `npx expo run:android --variant release`: native project generated, then
  stopped because Android SDK/`adb` is absent (`spawn adb ENOENT`).

No FPS, frame-time distribution, or memory values were recorded because
neither native release app launched. Do not copy placeholder values into QA
reports.
