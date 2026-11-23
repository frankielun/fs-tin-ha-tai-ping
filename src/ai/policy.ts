import type {
  Action,
  Command,
  Difficulty,
  PlayerId,
  PublicGameSnapshot,
  RandomSource,
  RpsChoice,
} from "../engine/contracts.js";

const RPS_CHOICES: readonly RpsChoice[] = ["rock", "paper", "scissors"];
const EASY_HIT_QUALITIES = ["miss", "hit", "centerHit"] as const;

type ActionCommand = Extract<Command, { type: "chooseAction" }>;
type FireCommand = Extract<Command, { type: "resolveFire" }>;

export interface AiPolicyOptions {
  readonly difficulty: Difficulty;
  readonly playerId?: PlayerId;
  /** Injected in tests and in deterministic/replayable matches. */
  readonly random?: RandomSource;
  /** Alias for callers that use the shorter name. */
  readonly rng?: RandomSource;
}

/**
 * A policy adapter over the public engine contract.
 *
 * This class never receives an engine instance and never reads an internal
 * state. In particular, chooseRps intentionally has no opponent-choice
 * parameter: a pending human throw cannot influence the AI throw.
 */
export class AiPolicy {
  public readonly difficulty: Difficulty;
  public readonly playerId: PlayerId;
  private readonly random: RandomSource;

  public constructor(options: AiPolicyOptions) {
    this.difficulty = options.difficulty;
    this.playerId = options.playerId ?? "player2";
    this.random = options.random ?? options.rng ?? Math.random;
  }

  /**
   * Select a fair throw. The optional snapshot is accepted for convenient
   * callers, but is deliberately ignored.
   */
  public chooseRps(_snapshot?: PublicGameSnapshot): RpsChoice {
    return RPS_CHOICES[this.randomIndex(RPS_CHOICES.length)] as RpsChoice;
  }

  public chooseRpsCommand(snapshot: PublicGameSnapshot): Command | undefined {
    if (snapshot.status !== "rps" || snapshot.pendingRps.includes(this.playerId)) {
      return undefined;
    }
    return {
      type: "submitRps",
      playerId: this.playerId,
      choice: this.chooseRps(),
    };
  }

  /**
   * Select a legal build/repair command. The supplied legal list is treated
   * as authoritative; the snapshot is only used for the policy's public
   * board heuristics.
   */
  public chooseAction(
    snapshot: PublicGameSnapshot,
    legalActions: readonly Action[] = snapshot.availableActions,
  ): ActionCommand | undefined {
    if (snapshot.status !== "action" || snapshot.turnPlayer !== this.playerId) {
      return undefined;
    }

    const legal = new Set(legalActions);
    if (legal.size === 0) return undefined;

    if (this.difficulty === "easy") {
      return { type: "chooseAction", action: this.pickFrom(legalActions) };
    }

    // Repair is the strongest comeback action and is always preferred when
    // legal. The engine still validates the exact repair order.
    if (legal.has("repair") && this.hasRepairablePiece(snapshot)) {
      return { type: "chooseAction", action: "repair" };
    }

    // The engine exposes build-order legality. Within that legal set, finish
    // weapons before adding more shields, then continue the prescribed order.
    // This prevents a standard AI from stalling on a cosmetic preference.
    const preference: readonly Action[] = [
      "deployCannon",
      "deployWarplane",
      "raiseShield",
      "plantFlag",
      "writeCharacter",
      "repair",
    ];
    const action = preference.find((candidate) => legal.has(candidate));
    return action === undefined ? undefined : { type: "chooseAction", action };
  }

  /**
   * Select a legal fire command. Easy samples every legal weapon and target;
   * Standard chooses the target with the greatest visible cascade potential
   * and takes the highest-damage shot.
   */
  public chooseFire(
    snapshot: PublicGameSnapshot,
    legalTargetIds: readonly string[] = snapshot.legalTargetIds,
  ): FireCommand | undefined {
    if (
      (snapshot.status !== "fire" && snapshot.status !== "action") ||
      snapshot.turnPlayer !== this.playerId ||
      legalTargetIds.length === 0
    ) {
      return undefined;
    }

    const weapons = snapshot.players[this.playerId].weapons.filter(
      (piece) => !piece.destroyed,
    );
    if (weapons.length === 0) return undefined;

    const weapon = this.difficulty === "easy"
      ? this.pickFrom(weapons)
      : weapons[0];
    if (weapon === undefined) return undefined;

    const targetId = this.difficulty === "easy"
      ? this.pickFrom(legalTargetIds)
      : this.selectCascadeTarget(snapshot, legalTargetIds);

    return {
      type: "resolveFire",
      weaponId: weapon.id,
      targetId,
      quality: this.difficulty === "easy"
        ? this.pickFrom(EASY_HIT_QUALITIES)
        : "centerHit",
    };
  }

  /**
   * Return the next command the AI can make from a public snapshot.
   * `legalActions` and `legalTargetIds` allow a coordinator to pass direct
   * engine queries while retaining the same policy.
   */
  public chooseCommand(
    snapshot: PublicGameSnapshot,
    legalActions?: readonly Action[],
    legalTargetIds?: readonly string[],
  ): Command | undefined {
    if (snapshot.status === "rps") {
      return this.chooseRpsCommand(snapshot);
    }

    if (snapshot.status === "action" && snapshot.turnPlayer === this.playerId) {
      const action = this.chooseAction(snapshot, legalActions ?? snapshot.availableActions);
      if (action !== undefined) return action;
    }

    if (
      (snapshot.status === "fire" || snapshot.status === "action") &&
      snapshot.turnPlayer === this.playerId
    ) {
      return this.chooseFire(snapshot, legalTargetIds ?? snapshot.legalTargetIds);
    }

    return undefined;
  }

  private randomIndex(length: number): number {
    if (length <= 1) return 0;
    const value = this.random();
    if (!Number.isFinite(value) || value <= 0) return 0;
    if (value >= 1) return length - 1;
    return Math.floor(value * length);
  }

  private pickFrom<T>(values: readonly T[]): T {
    const value = values[this.randomIndex(values.length)];
    if (value === undefined) {
      throw new Error("AI policy cannot choose from an empty legal list.");
    }
    return value;
  }

  private hasRepairablePiece(snapshot: PublicGameSnapshot): boolean {
    return [
      ...snapshot.players[this.playerId].characters,
      ...snapshot.players[this.playerId].flags,
      ...snapshot.players[this.playerId].shields,
      ...snapshot.players[this.playerId].weapons,
    ].some((piece) => piece.destroyed);
  }

  private selectCascadeTarget(
    snapshot: PublicGameSnapshot,
    legalTargetIds: readonly string[],
  ): string {
    const defenderId: PlayerId = this.playerId === "player1" ? "player2" : "player1";
    const defender = snapshot.players[defenderId];
    const cascadeOrder = [
      ...defender.shields.filter((piece) => !piece.destroyed).reverse(),
      ...defender.weapons.filter((piece) => !piece.destroyed).reverse(),
      ...defender.flags.filter((piece) => !piece.destroyed),
      ...defender.characters.filter((piece) => !piece.destroyed).reverse(),
    ];
    const legal = new Set(legalTargetIds);

    // A target's expected center-hit damage is the smaller of two HP and the
    // number of active pieces behind it. Ties retain engine-provided order.
    let bestTarget = legalTargetIds[0] as string;
    let bestDamage = -1;
    for (const [index, piece] of cascadeOrder.entries()) {
      if (!legal.has(piece.id)) continue;
      const expectedDamage = Math.min(2, cascadeOrder.length - index);
      if (expectedDamage > bestDamage) {
        bestDamage = expectedDamage;
        bestTarget = piece.id;
      }
    }
    return bestTarget;
  }
}

export function createAiPolicy(options: AiPolicyOptions): AiPolicy {
  return new AiPolicy(options);
}

export { AiPolicy as AIPolicy };
