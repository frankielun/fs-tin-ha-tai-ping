import { useFrame } from "@react-three/fiber/native";
import { useRef } from "react";
import * as THREE from "three";
import type { PlayerId } from "../engine/index";
import type { BattlefieldPiece, Glyph } from "./projection";
import { GLYPH_STROKES } from "./glyphs";
import type { BattlefieldResources } from "./resources";

function GlyphMesh({ glyph, resources }: { glyph: Glyph; resources: BattlefieldResources }) {
  return (
    <group position={[0, 0, 0.075]} scale={[0.58, 0.58, 1]}>
      {GLYPH_STROKES[glyph].map(([x, y, width, height, angle = 0], index) => (
        <mesh
          key={index}
          geometry={resources.geometry.box}
          material={resources.material.glyph}
          position={[x, y, 0]}
          rotation={[0, 0, angle]}
          scale={[width, height, 0.045]}
        />
      ))}
    </group>
  );
}

function Character({ piece, resources }: { piece: BattlefieldPiece; resources: BattlefieldResources }) {
  if (piece.glyph === null) return null;
  const x = -1.35 + piece.slot * 0.9;
  const side = piece.playerId === "player1" ? 1 : -1;
  const dark = piece.playerId === "player1" ? resources.material.player1Dark : resources.material.player2Dark;
  return (
    <group position={[x, 1.15, -side * 1.23]}>
      <mesh geometry={resources.geometry.box} material={dark} scale={[0.72, 0.76, 0.12]} />
      <GlyphMesh glyph={piece.glyph} resources={resources} />
    </group>
  );
}

function Flag({ piece, resources }: { piece: BattlefieldPiece; resources: BattlefieldResources }) {
  const flagMaterials = [resources.material.flag1, resources.material.flag2, resources.material.flag3];
  return (
    <group position={[-1.2 + piece.slot * 1.2, 0.8, 0]}>
      <mesh
        geometry={resources.geometry.cylinder}
        material={resources.material.wood}
        position={[0, 0.65, 0]}
        scale={[0.045, 1.5, 0.045]}
      />
      <mesh
        geometry={resources.geometry.box}
        material={flagMaterials[piece.slot] ?? resources.material.flag1}
        position={[0.31, 1.18, 0]}
        scale={[0.62, 0.38, 0.055]}
      />
    </group>
  );
}

function Cannon({ piece, resources }: { piece: BattlefieldPiece; resources: BattlefieldResources }) {
  const side = piece.playerId === "player1" ? 1 : -1;
  return (
    <group position={[-1.15 + piece.slot * 1.15, 0.96, -side * 0.45]}>
      <mesh
        geometry={resources.geometry.cylinder}
        material={resources.material.metal}
        scale={[0.34, 0.24, 0.34]}
      />
      <mesh
        geometry={resources.geometry.cylinder}
        material={resources.material.metal}
        position={[0, 0.25, -side * 0.3]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.12, 0.9, 0.12]}
      />
      <mesh
        geometry={resources.geometry.sphere}
        material={resources.material.stoneDark}
        position={[0, 0.22, 0]}
        scale={[0.22, 0.22, 0.22]}
      />
    </group>
  );
}

function Warplane({ piece, resources }: { piece: BattlefieldPiece; resources: BattlefieldResources }) {
  const ref = useRef<THREE.Group>(null);
  const side = piece.playerId === "player1" ? 1 : -1;
  const baseY = 2.25 + piece.slot * 0.18;
  useFrame(({ clock }) => {
    const group = ref.current;
    if (group === null) return;
    const time = clock.elapsedTime + piece.slot * 1.7 + (piece.playerId === "player1" ? 0 : 0.8);
    group.position.y = baseY + Math.sin(time * 1.8) * 0.1;
    group.rotation.z = Math.sin(time * 1.3) * 0.055;
  });
  return (
    <group ref={ref} position={[-1.25 + piece.slot * 1.25, baseY, side * 0.15]}>
      <mesh
        geometry={resources.geometry.cylinder}
        material={resources.material.plane}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.16, 0.9, 0.16]}
      />
      <mesh geometry={resources.geometry.box} material={resources.material.stone} scale={[1.05, 0.09, 0.3]} />
      <mesh
        geometry={resources.geometry.box}
        material={piece.playerId === "player1" ? resources.material.player1 : resources.material.player2}
        position={[0, 0.15, side * 0.33]}
        scale={[0.4, 0.3, 0.08]}
      />
    </group>
  );
}

export function FortressBase({ playerId, resources }: { playerId: PlayerId; resources: BattlefieldResources }) {
  const side = playerId === "player1" ? 1 : -1;
  const main = playerId === "player1" ? resources.material.player1 : resources.material.player2;
  const dark = playerId === "player1" ? resources.material.player1Dark : resources.material.player2Dark;
  return (
    <group position={[0, 0, side * 4.25]}>
      <mesh geometry={resources.geometry.box} material={main} position={[0, 0.42, 0]} scale={[4.3, 0.84, 2.5]} />
      <mesh geometry={resources.geometry.box} material={dark} position={[0, 0.87, 0]} scale={[3.6, 0.16, 2.05]} />
      {[-1.75, 1.75].flatMap((x) =>
        [-0.88, 0.88].map((z) => (
          <group key={`${x}:${z}`} position={[x, 0.96, z]}>
            <mesh geometry={resources.geometry.cylinder} material={main} scale={[0.43, 1.15, 0.43]} />
            <mesh geometry={resources.geometry.cone} material={resources.material.stone} position={[0, 0.82, 0]} scale={[0.55, 0.5, 0.55]} />
          </group>
        )),
      )}
      {[-1.2, -0.4, 0.4, 1.2].map((x) => (
        <mesh key={x} geometry={resources.geometry.box} material={resources.material.stone} position={[x, 1.03, -side * 1.12]} scale={[0.36, 0.36, 0.3]} />
      ))}
    </group>
  );
}

export function FortressPieces({ pieces, resources }: { pieces: readonly BattlefieldPiece[]; resources: BattlefieldResources }) {
  return (
    <>
      {pieces.map((piece) => {
        switch (piece.kind) {
          case "character":
            return <Character key={piece.id} piece={piece} resources={resources} />;
          case "flag":
            return <Flag key={piece.id} piece={piece} resources={resources} />;
          case "cannon":
            return <Cannon key={piece.id} piece={piece} resources={resources} />;
          case "warplane":
            return <Warplane key={piece.id} piece={piece} resources={resources} />;
          case "shield":
            return null;
        }
      })}
    </>
  );
}

export function ShieldLayers({ playerId, count, resources }: { playerId: PlayerId; count: number; resources: BattlefieldResources }) {
  const side = playerId === "player1" ? 1 : -1;
  return (
    <group position={[0, 0.82, side * 4.25]}>
      {Array.from({ length: count }, (_, index) => {
        const radius = 2.15 + index * 0.17;
        return (
          <mesh
            key={index}
            geometry={resources.geometry.dome}
            material={resources.material.shield}
            scale={[radius, radius * 0.66, radius * 0.72]}
          />
        );
      })}
    </group>
  );
}
