# 07: 射靶 fire minigame + 3D cannon destruction

**What to build:** The juice moment of the game: attacker picks weapon +
legal target, a crosshair sweeps the target, FIRE inside the bullseye
registers 1 dmg (center = 2, miss = 0), and a 3D projectile flies out and
shatters the target into particle debris with camera shake. Cannon vs
warplane accuracy curves differ via tunable data.

**Blocked by:** 02 — Engine fire resolution · 06 — Winner action menu

**Status:** ready-for-agent

- [ ] Weapon + target selection restricted to legal targets per engine
- [ ] Crosshair sweeps the target; FIRE inside bullseye = 1 dmg, center =
      2 dmg, miss = 0 dmg; result feeds the engine cascade
- [ ] Cannon and warplane accuracy profiles differ and are data-driven
      tunables (crosshair speed, bullseye size curves)
- [ ] Hit triggers 3D projectile + target shatter particles + camera shake
- [ ] Fire sequence holds ~60fps on a mid-range device (spot check)

⭐ This is the emotional core moment — concentrate the juice budget here.
