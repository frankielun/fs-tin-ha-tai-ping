import { Canvas } from "@react-three/fiber/native";
import { useMemo } from "react";
import type { PublicGameSnapshot } from "../engine/index";
import { t } from "../app/tokens";
import { FortressBase, FortressPieces, ShieldLayers } from "./pieces";
import { projectBattlefield } from "./projection";
import { useBattlefieldResources } from "./resources";
import { RpsHands, type RpsResolvedEvent } from "./RpsHands";

function Battlefield({ snapshot, rpsEvent }: {
  snapshot: PublicGameSnapshot;
  rpsEvent: RpsResolvedEvent | null;
}) {
  const resources = useBattlefieldResources();
  const projection = useMemo(() => projectBattlefield(snapshot), [snapshot]);
  const player1Pieces = useMemo(
    () => projection.pieces.filter((piece) => piece.playerId === "player1"),
    [projection],
  );
  const player2Pieces = useMemo(
    () => projection.pieces.filter((piece) => piece.playerId === "player2"),
    [projection],
  );

  return (
    <>
      <color attach="background" args={[t.color.sky]} />
      <ambientLight intensity={1.45} />
      <directionalLight position={[-4, 10, 8]} intensity={2.1} />
      <mesh geometry={resources.geometry.box} material={resources.material.groundEdge} position={[0, -0.2, 0]} scale={[11.4, 0.35, 15.2]} />
      <mesh geometry={resources.geometry.plane} material={resources.material.ground} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={resources.geometry.box} material={resources.material.groundEdge} position={[0, 0.025, 0]} scale={[10.5, 0.05, 0.35]} />

      <FortressBase playerId="player1" resources={resources} />
      <FortressBase playerId="player2" resources={resources} />
      <group position={[0, 0, 4.25]}>
        <FortressPieces pieces={player1Pieces} resources={resources} />
      </group>
      <group position={[0, 0, -4.25]}>
        <FortressPieces pieces={player2Pieces} resources={resources} />
      </group>
      <ShieldLayers playerId="player1" count={projection.players.player1.shields} resources={resources} />
      <ShieldLayers playerId="player2" count={projection.players.player2.shields} resources={resources} />
      <RpsHands event={rpsEvent} resources={resources} />
    </>
  );
}

export function BattlefieldScene({ snapshot, rpsEvent = null }: {
  snapshot: PublicGameSnapshot;
  rpsEvent?: RpsResolvedEvent | null;
}) {
  return (
    <Canvas
      camera={{ position: [0, 12.8, 16.8], fov: 43, near: 0.1, far: 60 }}
      frameloop="always"
    >
      <Battlefield snapshot={snapshot} rpsEvent={rpsEvent} />
    </Canvas>
  );
}
