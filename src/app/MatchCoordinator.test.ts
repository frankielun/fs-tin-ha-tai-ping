import { describe, expect, it, vi } from "vitest";
import type { EngineEvent } from "../engine/index";
import { MatchCoordinator } from "./MatchCoordinator";
import { createDemoCoordinator, createReplayCommands, DEMO_COMMAND_COUNT } from "./replay";

 describe("MatchCoordinator", () => {
  it("publishes accepted snapshots and ordered one-shot events", () => {
    const coordinator = new MatchCoordinator();
    const snapshotListener = vi.fn();
    const events: EngineEvent[] = [];
    coordinator.subscribeToSnapshot(snapshotListener);
    coordinator.subscribeToEvents((event) => events.push(event));

    coordinator.dispatch({ type: "startMatch", mode: "passAndPlay", seed: 7 });

    expect(snapshotListener).toHaveBeenCalledOnce();
    expect(coordinator.getSnapshot().matchId).toMatch(/^match-7-/);
    expect(events.map((event) => event.type)).toEqual(["matchStarted"]);
  });

  it("does not publish rejected commands", () => {
    const coordinator = new MatchCoordinator();
    const listener = vi.fn();
    coordinator.subscribeToSnapshot(listener);
    const before = coordinator.getSnapshot();

    coordinator.dispatch({ type: "chooseAction", action: "plantFlag" });

    expect(listener).not.toHaveBeenCalled();
    expect(coordinator.getSnapshot()).toBe(before);
    expect(coordinator.getLastError()?.code).toBe("ACTION_NOT_EXPECTED");
  });
});

describe("debug replay", () => {
  it("builds the complete demo only through engine commands", () => {
    const coordinator = createDemoCoordinator();
    const snapshot = coordinator.getSnapshot();

    expect(coordinator.getLastError()).toBeNull();
    expect(snapshot.sequence).toBeGreaterThan(0);
    for (const player of Object.values(snapshot.players)) {
      expect(player.characters).toHaveLength(4);
      expect(player.flags).toHaveLength(3);
      expect(player.shields).toHaveLength(5);
      expect(player.weapons).toHaveLength(3);
    }
    expect(createReplayCommands()).toHaveLength(DEMO_COMMAND_COUNT + 3);
  });

  it("changes durable scene state on the scripted fire command", () => {
    const coordinator = createDemoCoordinator();
    const before = coordinator.getSnapshot().players.player2.shields.length;
    const commands = createReplayCommands();
    for (const command of commands.slice(DEMO_COMMAND_COUNT)) coordinator.dispatch(command);

    expect(coordinator.getLastError()).toBeNull();
    expect(coordinator.getSnapshot().players.player2.shields.filter((piece) => !piece.destroyed)).toHaveLength(before - 2);
  });
});
