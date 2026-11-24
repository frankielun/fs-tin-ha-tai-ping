# Recorded flow: interactive RPS vs AI

Last verified: 2026-11-24, Android API 37 emulator and iPhone 17 simulator launch smoke.

1. Launch the normal app (not `BattlefieldApp debug`) and confirm round 1 plus 包 / 剪 / 揼.
2. Tap `rps-paper`, `rps-scissors`, or `rps-rock` (`出包` / `出剪` / `出揼`). Inputs lock while both 3D hands animate, then the engine-produced result appears.
3. On a draw, confirm input unlocks on the same engine round. On a player win, confirm the ticket-06 action-menu placeholder. On an AI win, confirm the round counter increments and the blue fortress gains the AI-selected piece.
4. Android bounds discovery: `adb shell uiautomator dump /sdcard/window.xml && adb pull /sdcard/window.xml .scratch/mvp/evidence/05/android-current.xml`; tap the centre of the selected button bounds with `adb shell input tap x y`.

Evidence is local-only under `.scratch/mvp/evidence/05/`. The iOS simulator verifies RN launch/UI only; its blank GL surface is the documented platform limitation.
