import { useFrame } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { EngineEvent, PlayerId, RpsChoice } from "../engine/index";
import type { BattlefieldResources } from "./resources";
import { rpsHandShape } from "./rps";

export type RpsResolvedEvent = Extract<EngineEvent, { type: "rpsResolved" }>;

const HAND_DURATION_SECONDS = 2.2;

function HandShape({ choice, resources, material }: {
  choice: RpsChoice;
  resources: BattlefieldResources;
  material: THREE.Material;
}) {
  const shape = rpsHandShape(choice);
  return (
    <>
      <mesh
        geometry={resources.geometry.cylinder}
        material={material}
        position={[0, -0.85, 0.55]}
        rotation={[Math.PI / 5, 0, 0]}
        scale={[0.4, 1.5, 0.4]}
      />
      {shape === "flatPalm" ? (
        <>
          <mesh geometry={resources.geometry.box} material={material} scale={[1.45, 0.32, 1.5]} />
          {[-0.54, -0.18, 0.18, 0.54].map((x) => (
            <mesh
              key={x}
              geometry={resources.geometry.box}
              material={material}
              position={[x, 0, -1.02]}
              scale={[0.3, 0.28, 0.75]}
            />
          ))}
        </>
      ) : null}
      {shape === "roundedFist" ? (
        <>
          <mesh geometry={resources.geometry.sphere} material={material} scale={[1.05, 0.9, 1.05]} />
          <mesh
            geometry={resources.geometry.sphere}
            material={material}
            position={[0.78, -0.05, -0.25]}
            scale={[0.48, 0.48, 0.65]}
          />
        </>
      ) : null}
      {shape === "twoProngs" ? (
        <>
          <mesh geometry={resources.geometry.box} material={material} scale={[1.05, 0.48, 0.95]} />
          <mesh
            geometry={resources.geometry.box}
            material={material}
            position={[-0.34, 0, -1.12]}
            rotation={[0, -0.16, 0]}
            scale={[0.34, 0.3, 1.65]}
          />
          <mesh
            geometry={resources.geometry.box}
            material={material}
            position={[0.34, 0, -1.12]}
            rotation={[0, 0.16, 0]}
            scale={[0.34, 0.3, 1.65]}
          />
        </>
      ) : null}
    </>
  );
}

function animateHand(
  group: THREE.Group | null,
  material: THREE.MeshStandardMaterial,
  elapsed: number,
  playerId: PlayerId,
  winner: RpsResolvedEvent["winner"],
): void {
  if (group === null) return;
  if (elapsed >= HAND_DURATION_SECONDS) {
    group.visible = false;
    return;
  }

  group.visible = true;
  const side = playerId === "player1" ? 1 : -1;
  const approach = Math.min(1, elapsed / 0.72);
  const eased = 1 - (1 - approach) * (1 - approach);
  group.position.set(0, 0.9 + eased * 2.25, side * (4.25 - eased * 3.55));

  let scale = 0.25 + eased * 0.75;
  let opacity = 1;
  if (elapsed > 0.9 && elapsed < 1.42 && winner === playerId) {
    scale *= 1 + Math.sin(((elapsed - 0.9) / 0.52) * Math.PI) * 0.42;
  }
  if (elapsed >= 1.5) {
    const dissolve = (elapsed - 1.5) / (HAND_DURATION_SECONDS - 1.5);
    scale *= Math.max(0.01, 1 - dissolve);
    opacity = Math.max(0, 1 - dissolve);
  }
  group.scale.setScalar(scale);
  material.opacity = opacity;
}

export function RpsHands({ event, resources }: {
  event: RpsResolvedEvent | null;
  resources: BattlefieldResources;
}) {
  const player1Ref = useRef<THREE.Group>(null);
  const player2Ref = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const activeSequence = useRef<number | null>(null);
  const materials = useMemo(() => ({
    player1: resources.material.player1.clone(),
    player2: resources.material.player2.clone(),
  }), [resources]);

  useEffect(() => {
    materials.player1.transparent = true;
    materials.player2.transparent = true;
    return () => {
      materials.player1.dispose();
      materials.player2.dispose();
    };
  }, [materials]);

  useFrame((_, delta) => {
    const sequence = event?.sequence ?? null;
    if (sequence !== activeSequence.current) {
      activeSequence.current = sequence;
      elapsed.current = 0;
    }
    if (event === null) {
      if (player1Ref.current !== null) player1Ref.current.visible = false;
      if (player2Ref.current !== null) player2Ref.current.visible = false;
      return;
    }

    elapsed.current += Math.min(delta, 0.05);
    animateHand(player1Ref.current, materials.player1, elapsed.current, "player1", event.winner);
    animateHand(player2Ref.current, materials.player2, elapsed.current, "player2", event.winner);
  });

  return (
    <>
      <group ref={player1Ref} visible={false}>
        <HandShape choice={event?.choices.player1 ?? "rock"} resources={resources} material={materials.player1} />
      </group>
      <group ref={player2Ref} visible={false} rotation={[0, Math.PI, 0]}>
        <HandShape choice={event?.choices.player2 ?? "rock"} resources={resources} material={materials.player2} />
      </group>
    </>
  );
}
