import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createDemoCoordinator, createReplayCommands, DEMO_COMMAND_COUNT } from "../app/replay";
import { GLYPH_STROKES } from "./glyphs";
import { projectBattlefield } from "./projection";
import { createBattlefieldResources } from "./resources";

function triangles(geometry: THREE.BufferGeometry): number {
  return (geometry.index?.count ?? geometry.attributes.position?.count ?? 0) / 3;
}

describe("battlefield projection", () => {
  it("reconciles active piece IDs and removes destroyed pieces on a new snapshot", () => {
    const coordinator = createDemoCoordinator();
    const before = projectBattlefield(coordinator.getSnapshot());
    expect(before.pieces).toHaveLength(30);
    expect(before.pieces.some((piece) => piece.id === "player2-shield-5")).toBe(true);
    expect(before.pieces.filter((piece) => piece.kind === "character").map((piece) => piece.glyph)).toEqual([
      "天", "下", "太", "平", "天", "下", "太", "平",
    ]);

    for (const command of createReplayCommands().slice(DEMO_COMMAND_COUNT)) coordinator.dispatch(command);
    const after = projectBattlefield(coordinator.getSnapshot());
    expect(after.sequence).toBeGreaterThan(before.sequence);
    expect(after.pieces).toHaveLength(28);
    expect(after.players.player2.shields).toBe(3);
    expect(after.pieces.some((piece) => piece.id === "player2-shield-5")).toBe(false);
  });

  it("keeps the fullest battlefield below the 5000-triangle budget", () => {
    const projection = projectBattlefield(createDemoCoordinator().getSnapshot());
    const { geometry } = createBattlefieldResources();
    const box = triangles(geometry.box);
    let count = 3 * box + triangles(geometry.plane);

    for (const playerId of ["player1", "player2"] as const) {
      count += 6 * box + 4 * (triangles(geometry.cylinder) + triangles(geometry.cone));
      count += projection.players[playerId].shields * triangles(geometry.dome);
    }
    for (const piece of projection.pieces) {
      if (piece.kind === "character") count += box * (1 + (piece.glyph === null ? 0 : GLYPH_STROKES[piece.glyph].length));
      if (piece.kind === "flag") count += triangles(geometry.cylinder) + box;
      if (piece.kind === "cannon") count += 2 * triangles(geometry.cylinder) + triangles(geometry.sphere);
      if (piece.kind === "warplane") count += triangles(geometry.cylinder) + 2 * box;
    }

    expect(count).toBeLessThan(5000);
    expect(count).toBeGreaterThan(0);
    for (const value of Object.values(geometry)) value.dispose();
  });
});
