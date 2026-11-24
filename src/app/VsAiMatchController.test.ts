import { describe, expect, it, vi } from "vitest";
import type { EngineEvent, RandomSource } from "../engine/index";
import { MatchCoordinator } from "./MatchCoordinator";
import { VsAiMatchController } from "./VsAiMatchController";

function createMatch(random: RandomSource) {
  const coordinator = new MatchCoordinator();
  const events: EngineEvent[] = [];
  coordinator.subscribeToEvents((event) => events.push(event));
  const match = new VsAiMatchController({ coordinator, seed: 17, random });
  return { coordinator, events, match };
}

describe("VsAiMatchController", () => {
  it("starts a real easy vs-AI match through the coordinator", () => {
    const { coordinator } = createMatch(() => 0);

    expect(coordinator.getSnapshot()).toMatchObject({
      status: "rps",
      mode: "vsAi",
      difficulty: "easy",
      round: 1,
      seed: 17,
    });
  });

  it("keeps the action phase with the player when the player wins", () => {
    const { coordinator, events, match } = createMatch(() => 0);

    match.submitPlayerRps("paper");

    expect(coordinator.getSnapshot().status).toBe("action");
    expect(coordinator.getSnapshot().turnPlayer).toBe("player1");
    expect(coordinator.getSnapshot().round).toBe(1);
    expect(events.map((event) => event.type)).toEqual([
      "matchStarted",
      "rpsResolved",
      "roundWon",
    ]);
  });

  it("immediately dispatches the AI action after an AI win", () => {
    const { coordinator, events, match } = createMatch(() => 0.5);

    match.submitPlayerRps("rock");

    expect(coordinator.getLastError()).toBeNull();
    expect(coordinator.getSnapshot().status).toBe("rps");
    expect(coordinator.getSnapshot().round).toBe(2);
    expect(coordinator.getSnapshot().players.player2.characters).toHaveLength(1);
    expect(events.map((event) => event.type)).toEqual([
      "matchStarted",
      "rpsResolved",
      "roundWon",
      "pieceBuilt",
    ]);
  });

  it("leaves a drawn round ready for another player throw without AI action", () => {
    const { coordinator, events, match } = createMatch(() => 0);

    match.submitPlayerRps("rock");

    expect(coordinator.getSnapshot()).toMatchObject({ status: "rps", round: 1, turnPlayer: null });
    expect(coordinator.getSnapshot().players.player2.characters).toHaveLength(0);
    expect(events.at(-1)).toMatchObject({ type: "rpsResolved", winner: "draw" });
  });

  it("does not dispatch duplicate input outside the RPS phase", () => {
    const { coordinator, match } = createMatch(() => 0);
    const dispatch = vi.spyOn(coordinator, "dispatch");
    match.submitPlayerRps("paper");
    const sequence = coordinator.getSnapshot().sequence;
    const dispatchCount = dispatch.mock.calls.length;

    match.submitPlayerRps("rock");

    expect(dispatch).toHaveBeenCalledTimes(dispatchCount);
    expect(coordinator.getSnapshot().sequence).toBe(sequence);
  });
});
