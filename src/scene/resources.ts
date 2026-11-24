import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { t } from "../app/tokens";

export function createBattlefieldResources() {
  const material = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.86, flatShading: true, ...extra });

  return {
    geometry: {
      box: new THREE.BoxGeometry(1, 1, 1),
      cylinder: new THREE.CylinderGeometry(1, 1, 1, 8, 1),
      cone: new THREE.ConeGeometry(1, 1, 6),
      sphere: new THREE.SphereGeometry(1, 8, 5),
      dome: new THREE.SphereGeometry(1, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2),
      plane: new THREE.PlaneGeometry(12, 16),
    },
    material: {
      ground: material(t.color.ground),
      groundEdge: material(t.color.groundEdge),
      player1: material(t.color.player1),
      player1Dark: material(t.color.player1Dark),
      player2: material(t.color.player2),
      player2Dark: material(t.color.player2Dark),
      stone: material(t.color.stone),
      stoneDark: material(t.color.stoneDark),
      wood: material(t.color.wood),
      flag1: material(t.color.flag1),
      flag2: material(t.color.flag2),
      flag3: material(t.color.flag3),
      metal: material(t.color.metal),
      plane: material(t.color.plane),
      glyph: new THREE.MeshBasicMaterial({ color: t.color.text }),
      shield: new THREE.MeshBasicMaterial({
        color: t.color.shield,
        transparent: true,
        opacity: 0.2,
        wireframe: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    },
  };
}

export type BattlefieldResources = ReturnType<typeof createBattlefieldResources>;

export function useBattlefieldResources(): BattlefieldResources {
  const resources = useMemo(createBattlefieldResources, []);
  useEffect(
    () => () => {
      for (const geometry of Object.values(resources.geometry)) geometry.dispose();
      for (const material of Object.values(resources.material)) material.dispose();
    },
    [resources],
  );
  return resources;
}
