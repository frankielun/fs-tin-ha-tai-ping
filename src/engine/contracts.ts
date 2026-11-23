export type PlayerId = "player1" | "player2";
export type RpsChoice = "rock" | "paper" | "scissors";
export type HitQuality = "miss" | "hit" | "centerHit";
export type MatchMode = "vsAi" | "passAndPlay";
export type Difficulty = "easy" | "standard";

export type Action =
  | "writeCharacter"
  | "plantFlag"
  | "raiseShield"
  | "deployCannon"
  | "deployWarplane"
  | "repair";

export type PieceKind =
  | "character"
  | "flag"
  | "shield"
  | "cannon"
  | "warplane";

export type Command =
  | {
      type: "startMatch";
      mode: MatchMode;
      difficulty?: Difficulty;
      seed: number;
    }
  | { type: "submitRps"; playerId: PlayerId; choice: RpsChoice }
  | { type: "chooseAction"; action: Action }
  | { type: "resolveFire"; weaponId: string; targetId: string; quality: HitQuality };

export type EngineEvent =
  | { type: "matchStarted"; sequence: number; matchId: string }
  | {
      type: "rpsResolved";
      sequence: number;
      winner: PlayerId | "draw";
      choices: Record<PlayerId, RpsChoice>;
    }
  | { type: "roundWon"; sequence: number; playerId: PlayerId }
  | {
      type: "pieceBuilt";
      sequence: number;
      playerId: PlayerId;
      pieceId: string;
      kind: string;
    }
  | {
      type: "fireStarted";
      sequence: number;
      attacker: PlayerId;
      weaponId: string;
      targetId: string;
    }
  | { type: "shotResolved"; sequence: number; quality: HitQuality; damage: 0 | 1 | 2 }
  | { type: "pieceDamaged"; sequence: number; pieceId: string; damage: number }
  | { type: "pieceDestroyed"; sequence: number; pieceId: string; kind: string }
  | { type: "repairCompleted"; sequence: number; pieceId: string }
  | { type: "matchOver"; sequence: number; winner: PlayerId; loser: PlayerId };

export type MatchStatus = "notStarted" | "rps" | "action" | "fire" | "over";

export interface PieceSnapshot {
  readonly id: string;
  readonly kind: PieceKind;
  readonly hp: 0 | 1;
  readonly destroyed: boolean;
}

export interface PlayerSnapshot {
  readonly id: PlayerId;
  readonly characters: readonly PieceSnapshot[];
  readonly flags: readonly PieceSnapshot[];
  readonly shields: readonly PieceSnapshot[];
  readonly weapons: readonly PieceSnapshot[];
}

export interface PublicGameSnapshot {
  readonly status: MatchStatus;
  readonly matchId: string | null;
  readonly mode: MatchMode | null;
  readonly difficulty: Difficulty | null;
  readonly seed: number | null;
  readonly round: number;
  readonly sequence: number;
  readonly turnPlayer: PlayerId | null;
  readonly lastRoundWinner: PlayerId | null;
  readonly winner: PlayerId | null;
  readonly loser: PlayerId | null;
  /**
   * Only player IDs are exposed. Choices are intentionally absent until the
   * second submission resolves the RPS round.
   */
  readonly pendingRps: readonly PlayerId[];
  readonly availableActions: readonly Action[];
  readonly legalTargetIds: readonly string[];
  readonly players: Readonly<Record<PlayerId, PlayerSnapshot>>;
}

export interface EngineError {
  readonly code: string;
  readonly message: string;
}

export interface EngineResult {
  readonly snapshot: PublicGameSnapshot;
  readonly events: readonly EngineEvent[];
  readonly error?: EngineError;
}

export type RandomSource = () => number;
