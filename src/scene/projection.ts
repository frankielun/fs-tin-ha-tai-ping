import type {
  PieceKind,
  PieceSnapshot,
  PlayerId,
  PlayerSnapshot,
  PublicGameSnapshot,
} from "../engine/index";

export type Glyph = "天" | "下" | "太" | "平";

export interface BattlefieldPiece {
  readonly id: string;
  readonly playerId: PlayerId;
  readonly kind: PieceKind;
  readonly slot: number;
  readonly glyph: Glyph | null;
}

export interface BattlefieldProjection {
  readonly sequence: number;
  readonly pieces: readonly BattlefieldPiece[];
  readonly players: Readonly<Record<PlayerId, { readonly shields: number }>>;
}

const GLYPHS: readonly Glyph[] = ["天", "下", "太", "平"];
const CHARACTER_NAMES = ["tian", "xia", "tai", "ping"] as const;

function activePieces(
  player: PlayerSnapshot,
  kind: PieceKind,
  pieces: readonly PieceSnapshot[],
): BattlefieldPiece[] {
  return pieces
    .filter((piece) => !piece.destroyed)
    .map((piece, slot) => {
      const nameIndex = CHARACTER_NAMES.findIndex((name) => piece.id.endsWith(`-${name}`));
      return {
        id: piece.id,
        playerId: player.id,
        kind,
        slot,
        glyph: kind === "character" && nameIndex >= 0 ? GLYPHS[nameIndex] ?? null : null,
      };
    });
}

/** Pure snapshot-to-view reconciliation. Destroyed durable pieces disappear. */
export function projectBattlefield(snapshot: PublicGameSnapshot): BattlefieldProjection {
  const pieces = (["player1", "player2"] as const).flatMap((playerId) => {
    const player = snapshot.players[playerId];
    return [
      ...activePieces(player, "character", player.characters),
      ...activePieces(player, "flag", player.flags),
      ...activePieces(player, "shield", player.shields),
      ...activePieces(player, "cannon", player.weapons.filter((piece) => piece.kind === "cannon")),
      ...activePieces(player, "warplane", player.weapons.filter((piece) => piece.kind === "warplane")),
    ];
  });

  return {
    sequence: snapshot.sequence,
    pieces,
    players: {
      player1: { shields: snapshot.players.player1.shields.filter((piece) => !piece.destroyed).length },
      player2: { shields: snapshot.players.player2.shields.filter((piece) => !piece.destroyed).length },
    },
  };
}
