import { GameEngine, type Action, type PlayerId } from "../src/engine/index.js";

const engine = new GameEngine();
const log = (message: string): void => console.log(message);

function command(command: Parameters<GameEngine["dispatch"]>[0]): void {
  const result = engine.dispatch(command);
  if (result.error !== undefined) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
  for (const event of result.events) {
    if (event.type === "pieceBuilt") {
      log(`${event.playerId} built ${event.kind} (${event.pieceId})`);
    } else if (event.type === "pieceDestroyed") {
      log(`${event.pieceId} destroyed`);
    } else if (event.type === "matchOver") {
      log(`${event.winner} wins; ${event.loser} loses`);
    }
  }
}

function winRound(player: PlayerId, action: Action): void {
  const player1Choice = "rock";
  const player2Choice = player === "player1" ? "scissors" : "paper";
  command({ type: "submitRps", playerId: "player1", choice: player1Choice });
  command({ type: "submitRps", playerId: "player2", choice: player2Choice });
  if (engine.getSnapshot().status === "action" && engine.getSnapshot().availableActions.includes(action)) {
    command({ type: "chooseAction", action });
  }
}

function build(player: PlayerId, action: Action, count: number): void {
  for (let index = 0; index < count; index += 1) winRound(player, action);
}

command({ type: "startMatch", mode: "passAndPlay", seed: 20261123 });
build("player1", "writeCharacter", 4);
build("player2", "writeCharacter", 4);
build("player1", "plantFlag", 3);
build("player2", "plantFlag", 3);
build("player1", "raiseShield", 5);
build("player2", "raiseShield", 5);
build("player1", "deployCannon", 3);
build("player2", "deployWarplane", 3);

let shots = 0;
while (engine.getSnapshot().status !== "over") {
  const before = engine.getSnapshot();
  const attacker = before.players.player1.weapons.some((piece) => !piece.destroyed)
    ? "player1"
    : "player2";
  if (attacker !== "player1") {
    throw new Error("Harness expected player1 to retain a weapon.");
  }
  const weaponId = before.players.player1.weapons.find((piece) => !piece.destroyed)?.id;
  if (weaponId === undefined) throw new Error("No weapon available.");
  winRound("player1", "deployCannon");
  const fireSnapshot = engine.getSnapshot();
  const targetId = fireSnapshot.legalTargetIds[0];
  if (targetId === undefined) throw new Error("No legal target available.");
  command({ type: "resolveFire", weaponId, targetId, quality: "centerHit" });
  shots += 1;
}

const finalSnapshot = engine.getSnapshot();
log(
  `Completed in ${finalSnapshot.round - 1} turns and ${shots} shots: ` +
    `${finalSnapshot.winner} defeated ${finalSnapshot.loser}.`,
);
