import type { Action, Command, PlayerId } from "../engine/index";
import { MatchCoordinator } from "./MatchCoordinator";

function winRound(player: PlayerId, action: Action): Command[] {
  return [
    { type: "submitRps", playerId: "player1", choice: "rock" },
    {
      type: "submitRps",
      playerId: "player2",
      choice: player === "player1" ? "scissors" : "paper",
    },
    { type: "chooseAction", action },
  ];
}

function build(player: PlayerId, action: Action, count: number): Command[] {
  return Array.from({ length: count }, () => winRound(player, action)).flat();
}

export const DEMO_COMMAND_COUNT = 1 + 2 * (4 + 3 + 5 + 3) * 3;

/** Deterministic engine commands only; no hand-authored gameplay snapshots. */
export function createReplayCommands(): readonly Command[] {
  return [
    { type: "startMatch", mode: "passAndPlay", seed: 20261124 },
    ...build("player1", "writeCharacter", 4),
    ...build("player2", "writeCharacter", 4),
    ...build("player1", "plantFlag", 3),
    ...build("player2", "plantFlag", 3),
    ...build("player1", "raiseShield", 5),
    ...build("player2", "raiseShield", 5),
    ...build("player1", "deployCannon", 2),
    ...build("player1", "deployWarplane", 1),
    ...build("player2", "deployCannon", 1),
    ...build("player2", "deployWarplane", 2),
    { type: "submitRps", playerId: "player1", choice: "rock" },
    { type: "submitRps", playerId: "player2", choice: "scissors" },
    {
      type: "resolveFire",
      weaponId: "player1-cannon-1",
      targetId: "player2-shield-5",
      quality: "centerHit",
    },
  ];
}

export function createDemoCoordinator(): MatchCoordinator {
  const coordinator = new MatchCoordinator();
  const commands = createReplayCommands();
  for (const command of commands.slice(0, DEMO_COMMAND_COUNT)) {
    coordinator.dispatch(command);
    if (coordinator.getLastError() !== null) {
      throw new Error(`Replay setup failed: ${coordinator.getLastError()?.message ?? "unknown"}`);
    }
  }
  return coordinator;
}
