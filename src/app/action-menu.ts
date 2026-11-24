import type { Action, PublicGameSnapshot } from "../engine/index";

export interface ActionMenuItem {
  readonly action: Action;
  readonly label: string;
}

export interface ActionMenuModel {
  readonly items: readonly ActionMenuItem[];
  readonly showFireHint: boolean;
}

const NEXT_CHARACTERS = ["天", "下", "太", "平"] as const;

function actionLabel(snapshot: PublicGameSnapshot, action: Action): string {
  const player = snapshot.players[snapshot.turnPlayer ?? "player1"];
  switch (action) {
    case "writeCharacter":
      return `寫字「${NEXT_CHARACTERS[player.characters.length] ?? ""}」`;
    case "plantFlag":
      return `插旗（第 ${player.flags.length + 1} 支）`;
    case "raiseShield":
      return `加保護罩（第 ${player.shields.length + 1} 層）`;
    case "deployCannon":
      return "起大炮";
    case "deployWarplane":
      return "起戰機";
    case "repair":
      return "修復";
  }
}

/** Presentation only: legal actions come directly from the engine snapshot. */
export function projectActionMenu(snapshot: PublicGameSnapshot): ActionMenuModel {
  const turnPlayer = snapshot.turnPlayer;
  return {
    items: snapshot.availableActions.map((action) => ({
      action,
      label: actionLabel(snapshot, action),
    })),
    showFireHint:
      turnPlayer !== null &&
      snapshot.players[turnPlayer].weapons.some((piece) => !piece.destroyed),
  };
}
