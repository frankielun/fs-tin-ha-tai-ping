import { describe, expect, it } from "vitest";
import { GameEngine, type Action, type PublicGameSnapshot } from "../engine/index";
import { projectActionMenu } from "./action-menu";
import { createDemoCoordinator, createReplayCommands, DEMO_COMMAND_COUNT } from "./replay";

function winRound(engine: GameEngine, action?: Action): PublicGameSnapshot {
  engine.dispatch({ type: "submitRps", playerId: "player1", choice: "rock" });
  const resolved = engine.dispatch({ type: "submitRps", playerId: "player2", choice: "scissors" });
  expect(resolved.error).toBeUndefined();
  if (action !== undefined) {
    const result = engine.dispatch({ type: "chooseAction", action });
    expect(result.error).toBeUndefined();
    return result.snapshot;
  }
  return resolved.snapshot;
}

function actions(snapshot: PublicGameSnapshot): readonly Action[] {
  return projectActionMenu(snapshot).items.map((item) => item.action);
}

describe("winner action menu projection", () => {
  it("uses snapshot legality at every build-order and cap boundary", () => {
    const engine = new GameEngine();
    engine.dispatch({ type: "startMatch", mode: "passAndPlay", seed: 6 });

    const first = winRound(engine);
    expect(actions(first)).toEqual(["writeCharacter"]);
    expect(projectActionMenu(first).items[0]?.label).toBe("寫字「天」");

    expect(engine.dispatch({ type: "chooseAction", action: "writeCharacter" }).error).toBeUndefined();
    for (let count = 0; count < 3; count += 1) winRound(engine, "writeCharacter");
    expect(engine.getSnapshot().players.player1.characters).toHaveLength(4);
    expect(actions(winRound(engine))).toEqual(["plantFlag"]);

    expect(engine.dispatch({ type: "chooseAction", action: "plantFlag" }).error).toBeUndefined();
    for (let count = 0; count < 2; count += 1) winRound(engine, "plantFlag");
    expect(engine.getSnapshot().players.player1.flags).toHaveLength(3);
    expect(actions(winRound(engine))).toEqual(["raiseShield"]);

    expect(engine.dispatch({ type: "chooseAction", action: "raiseShield" }).error).toBeUndefined();
    const withShield = winRound(engine);
    expect(actions(withShield)).toEqual(["raiseShield", "deployCannon", "deployWarplane"]);
    expect(projectActionMenu(withShield).showFireHint).toBe(false);

    expect(engine.dispatch({ type: "chooseAction", action: "raiseShield" }).error).toBeUndefined();
    for (let count = 0; count < 3; count += 1) winRound(engine, "raiseShield");
    expect(engine.getSnapshot().players.player1.shields).toHaveLength(5);
    expect(actions(winRound(engine))).toEqual(["deployCannon", "deployWarplane"]);

    expect(engine.dispatch({ type: "chooseAction", action: "deployCannon" }).error).toBeUndefined();
    const withWeapon = winRound(engine);
    expect(actions(withWeapon)).toEqual(["deployCannon", "deployWarplane"]);
    expect(projectActionMenu(withWeapon).showFireHint).toBe(true);
    expect(engine.dispatch({ type: "chooseAction", action: "deployWarplane" }).error).toBeUndefined();
    winRound(engine, "deployCannon");

    expect(engine.getSnapshot().players.player1.weapons).toHaveLength(3);
    const atWeaponCap = winRound(engine);
    expect(atWeaponCap.status).toBe("fire");
    expect(actions(atWeaponCap)).toEqual([]);
    expect(projectActionMenu(atWeaponCap).showFireHint).toBe(true);
  });

  it("offers repair only after engine damage and returns to RPS after restoration", () => {
    const coordinator = createDemoCoordinator();
    const commands = createReplayCommands();
    for (const command of commands.slice(DEMO_COMMAND_COUNT)) coordinator.dispatch(command);

    const beforeDamageMenu = projectActionMenu(coordinator.getSnapshot());
    expect(beforeDamageMenu.items).toEqual([]);

    coordinator.dispatch({ type: "submitRps", playerId: "player1", choice: "rock" });
    coordinator.dispatch({ type: "submitRps", playerId: "player2", choice: "paper" });
    const damaged = coordinator.getSnapshot();
    expect(damaged.players.player2.shields.filter((piece) => piece.destroyed)).toHaveLength(2);
    expect(actions(damaged)).toEqual(["repair"]);
    expect(projectActionMenu(damaged).showFireHint).toBe(true);

    coordinator.dispatch({ type: "chooseAction", action: "repair" });
    const repaired = coordinator.getSnapshot();
    expect(coordinator.getLastError()).toBeNull();
    expect(repaired.status).toBe("rps");
    expect(repaired.players.player2.shields.filter((piece) => piece.destroyed)).toHaveLength(1);
    expect(projectActionMenu(repaired).items).toEqual([]);
  });
});
