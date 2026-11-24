import {
  type Action,
  type Command,
  type Difficulty,
  type EngineEvent,
  type EngineError,
  type EngineResult,
  type HitQuality,
  type MatchMode,
  type MatchStatus,
  type PieceKind,
  type PieceSnapshot,
  type PlayerId,
  type PlayerSnapshot,
  type PublicGameSnapshot,
  type RandomSource,
  type RpsChoice,
} from "./contracts";

const PLAYER_IDS: readonly PlayerId[] = ["player1", "player2"];
const CHARACTER_NAMES = ["tian", "xia", "tai", "ping"] as const;
const CHARACTER_KINDS: readonly PieceKind[] = ["character", "character", "character", "character"];
export const ENGINE_RULES = Object.freeze({
  version: "1",
  caps: Object.freeze({ characters: 4, flags: 3, shields: 5, weapons: 3 }),
  hitDamage: Object.freeze({ miss: 0, hit: 1, centerHit: 2 }),
  cascadeOrder: Object.freeze(["outermostShields", "nearestWeapons", "flags", "characters"]),
});
const PIECE_CAPS = ENGINE_RULES.caps;

type CharacterName = (typeof CHARACTER_NAMES)[number];

interface InternalPiece {
  id: string;
  kind: PieceKind;
  hp: 0 | 1;
  destroyed: boolean;
}

interface InternalPlayer {
  id: PlayerId;
  characters: InternalPiece[];
  flags: InternalPiece[];
  shields: InternalPiece[];
  weapons: InternalPiece[];
}

interface InternalState {
  status: MatchStatus;
  matchId: string | null;
  mode: MatchMode | null;
  difficulty: Difficulty | null;
  seed: number | null;
  round: number;
  sequence: number;
  turnPlayer: PlayerId | null;
  lastRoundWinner: PlayerId | null;
  winner: PlayerId | null;
  loser: PlayerId | null;
  pendingRps: Partial<Record<PlayerId, RpsChoice>>;
  players: Record<PlayerId, InternalPlayer>;
}

const initialState = (): InternalState => ({
  status: "notStarted",
  matchId: null,
  mode: null,
  difficulty: null,
  seed: null,
  round: 0,
  sequence: 0,
  turnPlayer: null,
  lastRoundWinner: null,
  winner: null,
  loser: null,
  pendingRps: {},
  players: {
    player1: createPlayer("player1"),
    player2: createPlayer("player2"),
  },
});

function createPlayer(id: PlayerId): InternalPlayer {
  return { id, characters: [], flags: [], shields: [], weapons: [] };
}

function cloneState(state: InternalState): InternalState {
  return {
    ...state,
    pendingRps: { ...state.pendingRps },
    players: {
      player1: clonePlayer(state.players.player1),
      player2: clonePlayer(state.players.player2),
    },
  };
}

function clonePlayer(player: InternalPlayer): InternalPlayer {
  return {
    id: player.id,
    characters: player.characters.map(clonePiece),
    flags: player.flags.map(clonePiece),
    shields: player.shields.map(clonePiece),
    weapons: player.weapons.map(clonePiece),
  };
}

function clonePiece(piece: InternalPiece): InternalPiece {
  return { ...piece };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

function seededRandom(seed: number): RandomSource {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function active(pieces: readonly InternalPiece[]): InternalPiece[] {
  return pieces.filter((piece) => !piece.destroyed);
}

function builtCount(player: InternalPlayer, collection: keyof Pick<InternalPlayer, "characters" | "flags" | "shields" | "weapons">): number {
  return player[collection].length;
}

function getPiece(player: InternalPlayer, pieceId: string): InternalPiece | undefined {
  return [...player.characters, ...player.flags, ...player.shields, ...player.weapons].find(
    (piece) => piece.id === pieceId,
  );
}

function otherPlayer(playerId: PlayerId): PlayerId {
  return playerId === "player1" ? "player2" : "player1";
}

function winnerForRps(first: RpsChoice, second: RpsChoice): "player1" | "player2" | "draw" {
  if (first === second) return "draw";
  if (
    (first === "rock" && second === "scissors") ||
    (first === "paper" && second === "rock") ||
    (first === "scissors" && second === "paper")
  ) {
    return "player1";
  }
  return "player2";
}

function damageFor(quality: HitQuality): 0 | 1 | 2 {
  if (quality === "miss") return 0;
  if (quality === "hit") return 1;
  return 2;
}

function pieceSnapshot(piece: InternalPiece): PieceSnapshot {
  return {
    id: piece.id,
    kind: piece.kind,
    hp: piece.hp,
    destroyed: piece.destroyed,
  };
}

function playerSnapshot(player: InternalPlayer): PlayerSnapshot {
  return {
    id: player.id,
    characters: player.characters.map(pieceSnapshot),
    flags: player.flags.map(pieceSnapshot),
    shields: player.shields.map(pieceSnapshot),
    weapons: player.weapons.map(pieceSnapshot),
  };
}

function isDefeated(player: InternalPlayer): boolean {
  return (
    active(player.characters).length === 0 &&
    active(player.flags).length === 0 &&
    active(player.shields).length === 0
  );
}

export interface EngineOptions {
  readonly random?: RandomSource;
  /** Alias accepted by callers that name the injected source `rng`. */
  readonly rng?: RandomSource;
}

/**
 * The only gameplay authority. Commands synchronously produce a new public
 * snapshot and an ordered batch of domain events.
 */
export class GameEngine {
  private state: InternalState = initialState();
  private random: RandomSource;
  private readonly configuredRandom: RandomSource | undefined;

  public constructor(options: EngineOptions = {}) {
    this.configuredRandom = options.random ?? options.rng;
    this.random = this.configuredRandom ?? seededRandom(0);
  }

  public getSnapshot(): PublicGameSnapshot {
    return this.snapshot();
  }

  public dispatch(command: Command): EngineResult {
    if (this.state.status === "over" && command.type !== "startMatch") {
      return this.reject("MATCH_OVER", "No commands are accepted after matchOver.");
    }

    switch (command.type) {
      case "startMatch":
        return this.startMatch(command.mode, command.difficulty, command.seed);
      case "submitRps":
        return this.submitRps(command.playerId, command.choice);
      case "chooseAction":
        return this.chooseAction(command.action);
      case "resolveFire":
        return this.resolveFire(command.weaponId, command.targetId, command.quality);
    }
  }

  public execute(command: Command): EngineResult {
    return this.dispatch(command);
  }

  public getLegalActions(): readonly Action[] {
    if (this.state.status !== "action" || this.state.turnPlayer === null) return [];
    return this.legalActions(this.state.players[this.state.turnPlayer]);
  }

  public getLegalTargetIds(defenderId?: PlayerId): readonly string[] {
    if (
      (this.state.status !== "fire" && this.state.status !== "action") ||
      this.state.turnPlayer === null ||
      active(this.state.players[this.state.turnPlayer].weapons).length === 0
    ) {
      return [];
    }
    return this.legalTargetPieces(
      this.state.players[defenderId ?? otherPlayer(this.state.turnPlayer)],
    ).map((piece) => piece.id);
  }

  private startMatch(mode: MatchMode, difficulty: Difficulty | undefined, seed: number): EngineResult {
    if (this.state.status !== "notStarted") {
      return this.reject("MATCH_ALREADY_STARTED", "A match can only be started once per engine.");
    }
    if (!Number.isInteger(seed)) {
      return this.reject("INVALID_SEED", "Match seed must be an integer.");
    }

    this.random = this.configuredRandom ?? seededRandom(seed);
    const entropy = Math.floor(this.random() * 1_000_000);
    const next = initialState();
    next.status = "rps";
    next.matchId = `match-${seed}-${entropy}`;
    next.mode = mode;
    next.difficulty = mode === "vsAi" ? difficulty ?? "easy" : null;
    next.seed = seed;
    next.round = 1;
    const events: EngineEvent[] = [];
    this.emit(next, events, {
      type: "matchStarted",
      matchId: next.matchId,
    });
    this.state = next;
    return this.result(events);
  }

  private submitRps(playerId: PlayerId, choice: RpsChoice): EngineResult {
    if (this.state.status !== "rps") {
      return this.reject("RPS_NOT_EXPECTED", "RPS choices are only accepted at the start of a round.");
    }
    if (this.state.pendingRps[playerId] !== undefined) {
      return this.reject("RPS_ALREADY_SUBMITTED", `${playerId} has already submitted this round.`);
    }

    const next = cloneState(this.state);
    next.pendingRps[playerId] = choice;
    const events: EngineEvent[] = [];
    const first = next.pendingRps.player1;
    const second = next.pendingRps.player2;

    if (first === undefined || second === undefined) {
      this.state = next;
      return this.result(events);
    }

    const winner = winnerForRps(first, second);
    this.emit(next, events, {
      type: "rpsResolved",
      winner,
      choices: { player1: first, player2: second },
    });
    next.pendingRps = {};

    if (winner === "draw") {
      next.turnPlayer = null;
      next.lastRoundWinner = null;
      this.state = next;
      return this.result(events);
    }

    next.turnPlayer = winner;
    next.lastRoundWinner = winner;
    this.emit(next, events, { type: "roundWon", playerId: winner });
    next.status = this.legalActions(next.players[winner]).length > 0
      ? "action"
      : active(next.players[winner].weapons).length > 0
        ? "fire"
        : "rps";
    if (next.status === "rps") {
      next.turnPlayer = null;
      next.round += 1;
    }
    this.state = next;
    return this.result(events);
  }

  private chooseAction(action: Action): EngineResult {
    if (this.state.status !== "action" || this.state.turnPlayer === null) {
      return this.reject("ACTION_NOT_EXPECTED", "A build or repair action is not expected now.");
    }
    const playerId = this.state.turnPlayer;
    const player = this.state.players[playerId];
    if (!this.legalActions(player).includes(action)) {
      return this.reject("ILLEGAL_ACTION", `${action} is not legal for ${playerId} in this phase.`);
    }

    const next = cloneState(this.state);
    const nextPlayer = next.players[playerId];
    const events: EngineEvent[] = [];

    if (action === "repair") {
      const piece = this.earliestRepairable(nextPlayer);
      if (piece === undefined) {
        return this.reject("NOTHING_TO_REPAIR", "No built piece is damaged.");
      }
      piece.destroyed = false;
      piece.hp = 1;
      this.emit(next, events, { type: "repairCompleted", pieceId: piece.id });
    } else {
      const piece = this.buildPiece(nextPlayer, action);
      if (piece === undefined) {
        return this.reject("ILLEGAL_ACTION", `${action} cannot build a piece in this state.`);
      }
      this.emit(next, events, {
        type: "pieceBuilt",
        playerId,
        pieceId: piece.id,
        kind: piece.kind,
      });
    }

    this.finishTurn(next);
    this.state = next;
    return this.result(events);
  }

  private resolveFire(weaponId: string, targetId: string, quality: HitQuality): EngineResult {
    if (
      (this.state.status !== "fire" && this.state.status !== "action") ||
      this.state.turnPlayer === null
    ) {
      return this.reject("FIRE_NOT_EXPECTED", "Fire can only be resolved after a round winner has an available weapon.");
    }
    const attackerId = this.state.turnPlayer;
    const defenderId = otherPlayer(attackerId);
    const attacker = this.state.players[attackerId];
    const defender = this.state.players[defenderId];
    const weapon = getPiece(attacker, weaponId);
    if (weapon === undefined || weapon.kind === "character" || weapon.kind === "flag" || weapon.kind === "shield") {
      return this.reject("INVALID_WEAPON", "The selected weapon does not belong to the attacking player.");
    }
    if (weapon.destroyed) {
      return this.reject("WEAPON_DESTROYED", "A destroyed weapon cannot fire.");
    }
    const legalTargets = this.legalTargetPieces(defender);
    if (!legalTargets.some((piece) => piece.id === targetId)) {
      return this.reject(
        "ILLEGAL_TARGET",
        "Flags and characters cannot be targeted while shields or weapons remain.",
      );
    }

    const next = cloneState(this.state);
    const nextDefender = next.players[defenderId];
    const nextWeapon = getPiece(next.players[attackerId], weaponId);
    if (nextWeapon === undefined) {
      return this.reject("INVALID_WEAPON", "The selected weapon no longer exists.");
    }
    const events: EngineEvent[] = [];
    this.emit(next, events, {
      type: "fireStarted",
      attacker: attackerId,
      weaponId,
      targetId,
    });
    const damage = damageFor(quality);
    this.emit(next, events, { type: "shotResolved", quality, damage });

    if (damage > 0) {
      const cascade = this.cascadeFromTarget(nextDefender, targetId);
      let remaining = damage;
      for (const piece of cascade) {
        if (remaining === 0) break;
        if (piece.destroyed) continue;
        piece.hp = 0;
        piece.destroyed = true;
        this.emit(next, events, { type: "pieceDamaged", pieceId: piece.id, damage: 1 });
        this.emit(next, events, { type: "pieceDestroyed", pieceId: piece.id, kind: piece.kind });
        remaining -= 1;
      }
    }

    if (isDefeated(nextDefender)) {
      next.status = "over";
      next.turnPlayer = null;
      next.winner = attackerId;
      next.loser = defenderId;
      this.emit(next, events, { type: "matchOver", winner: attackerId, loser: defenderId });
    } else {
      this.finishTurn(next);
    }

    this.state = next;
    return this.result(events);
  }

  private legalActions(player: InternalPlayer): Action[] {
    const actions: Action[] = [];
    if (builtCount(player, "characters") < PIECE_CAPS.characters) {
      actions.push("writeCharacter");
    } else if (builtCount(player, "flags") < PIECE_CAPS.flags) {
      actions.push("plantFlag");
    } else {
      if (builtCount(player, "shields") < PIECE_CAPS.shields) {
        actions.push("raiseShield");
      }
      if (
        builtCount(player, "shields") > 0 &&
        builtCount(player, "weapons") < PIECE_CAPS.weapons
      ) {
        actions.push("deployCannon", "deployWarplane");
      }
    }
    if (this.earliestRepairable(player) !== undefined) actions.push("repair");
    return actions;
  }

  private buildPiece(player: InternalPlayer, action: Exclude<Action, "repair">): InternalPiece | undefined {
    const prefix = player.id;
    switch (action) {
      case "writeCharacter": {
        if (player.characters.length >= PIECE_CAPS.characters) return undefined;
        const name: CharacterName = CHARACTER_NAMES[player.characters.length] as CharacterName;
        const piece: InternalPiece = {
          id: `${prefix}-character-${name}`,
          kind: CHARACTER_KINDS[player.characters.length] as PieceKind,
          hp: 1,
          destroyed: false,
        };
        player.characters.push(piece);
        return piece;
      }
      case "plantFlag": {
        if (player.characters.length < PIECE_CAPS.characters || player.flags.length >= PIECE_CAPS.flags) {
          return undefined;
        }
        const piece: InternalPiece = {
          id: `${prefix}-flag-${player.flags.length + 1}`,
          kind: "flag",
          hp: 1,
          destroyed: false,
        };
        player.flags.push(piece);
        return piece;
      }
      case "raiseShield": {
        if (player.flags.length < PIECE_CAPS.flags || player.shields.length >= PIECE_CAPS.shields) {
          return undefined;
        }
        const piece: InternalPiece = {
          id: `${prefix}-shield-${player.shields.length + 1}`,
          kind: "shield",
          hp: 1,
          destroyed: false,
        };
        player.shields.push(piece);
        return piece;
      }
      case "deployCannon":
      case "deployWarplane": {
        if (player.shields.length < 1 || player.weapons.length >= PIECE_CAPS.weapons) {
          return undefined;
        }
        const kind: "cannon" | "warplane" = action === "deployCannon" ? "cannon" : "warplane";
        const piece: InternalPiece = {
          id: `${prefix}-${kind}-${player.weapons.length + 1}`,
          kind,
          hp: 1,
          destroyed: false,
        };
        player.weapons.push(piece);
        return piece;
      }
    }
  }

  private earliestRepairable(player: InternalPlayer): InternalPiece | undefined {
    for (const collection of [player.characters, player.flags, player.shields, player.weapons]) {
      const piece = collection.find((candidate) => candidate.destroyed);
      if (piece !== undefined) return piece;
    }
    return undefined;
  }

  private legalTargetPieces(defender: InternalPlayer): InternalPiece[] {
    const shields = active(defender.shields).reverse();
    if (shields.length > 0) return shields;
    const weapons = active(defender.weapons).reverse();
    if (weapons.length > 0) return weapons;
    const flags = active(defender.flags);
    if (flags.length > 0) return flags;
    return active(defender.characters).reverse();
  }

  private cascadeFromTarget(defender: InternalPlayer, targetId: string): InternalPiece[] {
    const ordered = [
      ...active(defender.shields).reverse(),
      ...active(defender.weapons).reverse(),
      ...active(defender.flags),
      ...active(defender.characters).reverse(),
    ];
    const targetIndex = ordered.findIndex((piece) => piece.id === targetId);
    return targetIndex < 0 ? [] : ordered.slice(targetIndex);
  }

  private finishTurn(next: InternalState): void {
    next.status = "rps";
    next.turnPlayer = null;
    next.pendingRps = {};
    next.round += 1;
  }

  private emit(
    state: InternalState,
    events: EngineEvent[],
    event:
      | { type: "matchStarted"; matchId: string }
      | { type: "rpsResolved"; winner: PlayerId | "draw"; choices: Record<PlayerId, RpsChoice> }
      | { type: "roundWon"; playerId: PlayerId }
      | { type: "pieceBuilt"; playerId: PlayerId; pieceId: string; kind: string }
      | { type: "fireStarted"; attacker: PlayerId; weaponId: string; targetId: string }
      | { type: "shotResolved"; quality: HitQuality; damage: 0 | 1 | 2 }
      | { type: "pieceDamaged"; pieceId: string; damage: number }
      | { type: "pieceDestroyed"; pieceId: string; kind: string }
      | { type: "repairCompleted"; pieceId: string }
      | { type: "matchOver"; winner: PlayerId; loser: PlayerId },
  ): void {
    state.sequence += 1;
    events.push({ ...event, sequence: state.sequence } as EngineEvent);
  }

  private snapshot(): PublicGameSnapshot {
    const availableActions =
      this.state.status === "action" && this.state.turnPlayer !== null
        ? this.legalActions(this.state.players[this.state.turnPlayer])
        : [];
    const legalTargetIds =
      (this.state.status === "fire" || this.state.status === "action") &&
      this.state.turnPlayer !== null &&
      active(this.state.players[this.state.turnPlayer].weapons).length > 0
        ? this.legalTargetPieces(this.state.players[otherPlayer(this.state.turnPlayer)]).map(
            (piece) => piece.id,
          )
        : [];
    return deepFreeze({
      status: this.state.status,
      matchId: this.state.matchId,
      mode: this.state.mode,
      difficulty: this.state.difficulty,
      seed: this.state.seed,
      round: this.state.round,
      sequence: this.state.sequence,
      turnPlayer: this.state.turnPlayer,
      lastRoundWinner: this.state.lastRoundWinner,
      winner: this.state.winner,
      loser: this.state.loser,
      pendingRps: PLAYER_IDS.filter((id) => this.state.pendingRps[id] !== undefined),
      availableActions,
      legalTargetIds,
      players: {
        player1: playerSnapshot(this.state.players.player1),
        player2: playerSnapshot(this.state.players.player2),
      },
    });
  }

  private result(events: readonly EngineEvent[]): EngineResult {
    return deepFreeze({ snapshot: this.snapshot(), events: [...events] });
  }

  private reject(code: string, message: string): EngineResult {
    const error: EngineError = { code, message };
    return deepFreeze({ snapshot: this.snapshot(), events: [], error });
  }
}

export function createSeededRandom(seed: number): RandomSource {
  return seededRandom(seed);
}

export function createEngine(options: EngineOptions = {}): GameEngine {
  return new GameEngine(options);
}

export { GameEngine as Engine };
