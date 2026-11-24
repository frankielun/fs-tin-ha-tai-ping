import { MatchCoordinator } from "../src/app/MatchCoordinator";
import { createReplayCommands, DEMO_COMMAND_COUNT } from "../src/app/replay";
import { projectBattlefield } from "../src/scene/projection";

const coordinator = new MatchCoordinator();
const commands = createReplayCommands();
let previousPieceIds = "";

commands.forEach((command, index) => {
  const snapshot = coordinator.dispatch(command);
  const error = coordinator.getLastError();
  if (error !== null) throw new Error(`${error.code}: ${error.message}`);

  if (index === DEMO_COMMAND_COUNT - 1 || index === commands.length - 1) {
    const battlefield = projectBattlefield(snapshot);
    const pieceIds = battlefield.pieces.map((piece) => piece.id).join(",");
    if (index === commands.length - 1 && pieceIds === previousPieceIds) {
      throw new Error("Replay did not change the projected scene.");
    }
    previousPieceIds = pieceIds;
    console.log(
      `snapshot ${snapshot.sequence}: ${battlefield.pieces.length} active pieces; ` +
        `${battlefield.players.player2.shields} player2 shield layers`,
    );
  }
});

console.log(`Replay passed: ${commands.length} commands changed the scene from engine snapshots.`);
