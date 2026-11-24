import { AiPolicy } from "../ai/policy";
import { createSeededRandom } from "../engine/index";
import type { PublicGameSnapshot, RandomSource, RpsChoice } from "../engine/index";
import { MatchCoordinator } from "./MatchCoordinator";

export interface VsAiMatchOptions {
  readonly seed: number;
  readonly random?: RandomSource;
  readonly coordinator?: MatchCoordinator;
}

/** Routes human input and AI decisions through the sole engine dispatcher. */
export class VsAiMatchController {
  public readonly coordinator: MatchCoordinator;
  private readonly ai: AiPolicy;

  public constructor(options: VsAiMatchOptions) {
    this.coordinator = options.coordinator ?? new MatchCoordinator();
    this.ai = new AiPolicy({
      difficulty: "easy",
      playerId: "player2",
      random: options.random ?? createSeededRandom(options.seed),
    });
    this.coordinator.dispatch({
      type: "startMatch",
      mode: "vsAi",
      difficulty: "easy",
      seed: options.seed,
    });
  }

  public submitPlayerRps(choice: RpsChoice): PublicGameSnapshot {
    const before = this.coordinator.getSnapshot();
    if (
      before.status !== "rps" ||
      before.pendingRps.includes("player1") ||
      before.pendingRps.includes("player2")
    ) {
      return before;
    }

    this.coordinator.dispatch({ type: "submitRps", playerId: "player1", choice });
    if (this.coordinator.getLastError() !== null) return this.coordinator.getSnapshot();

    const aiRps = this.ai.chooseCommand(this.coordinator.getSnapshot());
    if (aiRps?.type !== "submitRps") return this.coordinator.getSnapshot();
    this.coordinator.dispatch(aiRps);
    if (this.coordinator.getLastError() !== null) return this.coordinator.getSnapshot();

    const resolved = this.coordinator.getSnapshot();
    if (
      (resolved.status !== "action" && resolved.status !== "fire") ||
      resolved.turnPlayer !== "player2"
    ) {
      return resolved;
    }

    const aiAction = this.ai.chooseCommand(resolved);
    if (aiAction !== undefined && aiAction.type !== "submitRps") {
      this.coordinator.dispatch(aiAction);
    }
    return this.coordinator.getSnapshot();
  }
}
