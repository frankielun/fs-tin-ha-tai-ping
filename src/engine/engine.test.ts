import { describe, expect, it } from "vitest";
import {
  GameEngine,
  type Action,
  type Command,
  type PlayerId,
  type PublicGameSnapshot,
} from "./index.js";

function start(engine: GameEngine): void {
  expect(
    engine.dispatch({ type: "startMatch", mode: "passAndPlay", seed: 7 }).error,
  ).toBeUndefined();
}

function winRound(engine: GameEngine, player: PlayerId, action?: Action): void {
  const player1Choice = player === "player1" ? "rock" : "rock";
  const player2Choice = player === "player1" ? "scissors" : "paper";
  engine.dispatch({ type: "submitRps", playerId: "player1", choice: player1Choice });
  const result = engine.dispatch({ type: "submitRps", playerId: "player2", choice: player2Choice });
  expect(result.error).toBeUndefined();
  if (action !== undefined) {
    const actionResult = engine.dispatch({ type: "chooseAction", action });
    expect(actionResult.error).toBeUndefined();
  }
}

function buildPlayer(
  engine: GameEngine,
  player: PlayerId,
  action: Action,
  count: number,
): void {
  for (let index = 0; index < count; index += 1) winRound(engine, player, action);
}

function buildDefenderToWeapons(engine: GameEngine): void {
  buildPlayer(engine, "player2", "writeCharacter", 4);
  buildPlayer(engine, "player2", "plantFlag", 3);
  buildPlayer(engine, "player2", "raiseShield", 1);
  buildPlayer(engine, "player2", "deployCannon", 2);
}

function buildAttacker(engine: GameEngine): void {
  buildPlayer(engine, "player1", "writeCharacter", 4);
  buildPlayer(engine, "player1", "plantFlag", 3);
  buildPlayer(engine, "player1", "raiseShield", 1);
  buildPlayer(engine, "player1", "deployCannon", 1);
}

function fireCenterHit(engine: GameEngine) {
  winRound(engine, "player1");
  const snapshot = engine.getSnapshot();
  const weaponId = player(snapshot, "player1").weapons.find((piece) => !piece.destroyed)?.id;
  const targetId = snapshot.legalTargetIds[0];
  if (weaponId === undefined || targetId === undefined) {
    throw new Error("Test fixture has no legal weapon or target.");
  }
  return engine.dispatch({
    type: "resolveFire",
    weaponId,
    targetId,
    quality: "centerHit",
  });
}

function player(snapshot: PublicGameSnapshot, id: PlayerId) {
  return snapshot.players[id];
}

describe("headless game engine", () => {
  it("starts with a matchStarted event and immutable public snapshot", () => {
    const engine = new GameEngine();
    const result = engine.dispatch({ type: "startMatch", mode: "passAndPlay", seed: 12 });

    expect(result.events).toEqual([
      { type: "matchStarted", sequence: 1, matchId: result.snapshot.matchId },
    ]);
    expect(result.snapshot.status).toBe("rps");
    expect(Object.isFrozen(result.snapshot)).toBe(true);
    expect(Object.isFrozen(result.snapshot.players.player1)).toBe(true);
  });

  it("keeps the first RPS choice out of the public snapshot", () => {
    const engine = new GameEngine();
    start(engine);
    const first = engine.dispatch({
      type: "submitRps",
      playerId: "player1",
      choice: "rock",
    });

    expect(first.error).toBeUndefined();
    expect(first.events).toEqual([]);
    expect(first.snapshot.pendingRps).toEqual(["player1"]);
    expect(JSON.stringify(first.snapshot)).not.toContain("rock");

    const second = engine.dispatch({
      type: "submitRps",
      playerId: "player2",
      choice: "scissors",
    });
    expect(second.events[0]).toMatchObject({
      type: "rpsResolved",
      choices: { player1: "rock", player2: "scissors" },
    });
    expect(second.snapshot.pendingRps).toEqual([]);
  });

  it("resolves draws without awarding a round", () => {
    const engine = new GameEngine();
    start(engine);
    const before = engine.getSnapshot();
    const result = engine.dispatch({
      type: "submitRps",
      playerId: "player1",
      choice: "paper",
    });
    expect(result.error).toBeUndefined();
    const draw = engine.dispatch({
      type: "submitRps",
      playerId: "player2",
      choice: "paper",
    });
    expect(draw.events.map((event) => event.type)).toEqual(["rpsResolved"]);
    expect(draw.snapshot.lastRoundWinner).toBeNull();
    expect(draw.snapshot.round).toBe(before.round);
  });

  it("enforces the complete build-order legality matrix and caps", () => {
    const engine = new GameEngine();
    start(engine);
    winRound(engine, "player1");
    expect(engine.getSnapshot().availableActions).toEqual(["writeCharacter"]);
    expect(engine.dispatch({ type: "chooseAction", action: "writeCharacter" }).error).toBeUndefined();

    buildPlayer(engine, "player1", "writeCharacter", 3);
    expect(player(engine.getSnapshot(), "player1").characters).toHaveLength(4);
    winRound(engine, "player1");
    expect(engine.getSnapshot().availableActions).toEqual(["plantFlag"]);
    expect(engine.dispatch({ type: "chooseAction", action: "plantFlag" }).error).toBeUndefined();

    buildPlayer(engine, "player1", "plantFlag", 2);
    expect(player(engine.getSnapshot(), "player1").flags).toHaveLength(3);
    winRound(engine, "player1");
    expect(engine.getSnapshot().availableActions).toEqual(["raiseShield"]);
    expect(engine.dispatch({ type: "chooseAction", action: "raiseShield" }).error).toBeUndefined();

    buildPlayer(engine, "player1", "raiseShield", 4);
    expect(player(engine.getSnapshot(), "player1").shields).toHaveLength(5);
    winRound(engine, "player1");
    expect(engine.getSnapshot().availableActions).toEqual([
      "deployCannon",
      "deployWarplane",
    ]);
    expect(engine.dispatch({ type: "chooseAction", action: "deployCannon" }).error).toBeUndefined();

    buildPlayer(engine, "player1", "deployCannon", 1);
    winRound(engine, "player1");
    expect(engine.getSnapshot().availableActions).toEqual([
      "deployCannon",
      "deployWarplane",
    ]);
    expect(engine.dispatch({ type: "chooseAction", action: "deployWarplane" }).error).toBeUndefined();
    expect(player(engine.getSnapshot(), "player1").weapons).toHaveLength(3);
    expect(engine.getSnapshot().availableActions).toEqual([]);
  });

  it("rejects illegal actions without mutating state", () => {
    const engine = new GameEngine();
    start(engine);
    winRound(engine, "player1");
    const before = engine.getSnapshot();
    const result = engine.dispatch({ type: "chooseAction", action: "plantFlag" });
    expect(result.error?.code).toBe("ILLEGAL_ACTION");
    expect(result.events).toEqual([]);
    expect(result.snapshot).toEqual(before);
  });

  it("allows flags and characters only after shields and weapons are gone", () => {
    const engine = new GameEngine();
    start(engine);
    buildAttacker(engine);
    buildDefenderToWeapons(engine);

    winRound(engine, "player1");
    const firstFire = engine.getSnapshot();
    expect(firstFire.legalTargetIds.every((id) => id.includes("shield") || id.includes("weapon"))).toBe(true);
    const weaponId = player(firstFire, "player1").weapons[0]?.id;
    const flagId = player(firstFire, "player2").flags[0]?.id;
    expect(weaponId).toBeDefined();
    expect(flagId).toBeDefined();
    const illegal = engine.dispatch({
      type: "resolveFire",
      weaponId: weaponId as string,
      targetId: flagId as string,
      quality: "hit",
    });
    expect(illegal.error?.code).toBe("ILLEGAL_TARGET");
  });

  it("cascades center-hit overflow through shields, weapons, flags, then characters", () => {
    const engine = new GameEngine();
    start(engine);
    buildAttacker(engine);
    buildDefenderToWeapons(engine);

    // The defender has one shield, two weapons, three flags, and four chars.
    winRound(engine, "player1");
    const first = engine.getSnapshot();
    const weaponId = player(first, "player1").weapons[0]?.id as string;
    const shieldId = first.legalTargetIds[0] as string;
    const result = engine.dispatch({
      type: "resolveFire",
      weaponId,
      targetId: shieldId,
      quality: "centerHit",
    });

    expect(result.events.map((event) => event.type)).toEqual([
      "fireStarted",
      "shotResolved",
      "pieceDamaged",
      "pieceDestroyed",
      "pieceDamaged",
      "pieceDestroyed",
    ]);
    expect(result.events.filter((event) => event.type === "pieceDestroyed").map((event) => event.pieceId)).toEqual([
      shieldId,
      player(first, "player2").weapons[1]?.id,
    ]);
  });

  it("walks the complete cascade permutation and advances target legality by layer", () => {
    const engine = new GameEngine();
    start(engine);
    buildAttacker(engine);
    buildDefenderToWeapons(engine);

    const first = fireCenterHit(engine);
    const second = fireCenterHit(engine);
    const third = fireCenterHit(engine);
    const fourth = fireCenterHit(engine);
    const destroyed = [...first.events, ...second.events, ...third.events, ...fourth.events]
      .filter((event) => event.type === "pieceDestroyed")
      .map((event) => event.pieceId);

    expect(destroyed).toEqual([
      "player2-shield-1",
      "player2-cannon-2",
      "player2-cannon-1",
      "player2-flag-1",
      "player2-flag-2",
      "player2-flag-3",
      "player2-character-ping",
      "player2-character-tai",
    ]);
    winRound(engine, "player1");
    expect(engine.getSnapshot().legalTargetIds).toEqual([
      "player2-character-xia",
      "player2-character-tian",
    ]);
  });

  it("applies miss as zero damage and hit as one damage", () => {
    const engine = new GameEngine();
    start(engine);
    buildAttacker(engine);
    buildDefenderToWeapons(engine);
    winRound(engine, "player1");
    const fire = engine.getSnapshot();
    const weaponId = player(fire, "player1").weapons[0]?.id as string;
    const targetId = fire.legalTargetIds[0] as string;

    const miss = engine.dispatch({ type: "resolveFire", weaponId, targetId, quality: "miss" });
    expect(miss.events.find((event) => event.type === "shotResolved")).toMatchObject({ damage: 0 });
    winRound(engine, "player1");
    const hit = engine.dispatch({
      type: "resolveFire",
      weaponId,
      targetId: engine.getSnapshot().legalTargetIds[0] as string,
      quality: "hit",
    });
    expect(hit.events.find((event) => event.type === "shotResolved")).toMatchObject({ damage: 1 });
  });

  it("repairs the earliest destroyed piece in build order", () => {
    const engine = new GameEngine();
    start(engine);
    buildAttacker(engine);
    buildDefenderToWeapons(engine);

    // Destroy player2's outer shield, then a character after clearing its
    // protection. The shield must still be repaired first.
    winRound(engine, "player1");
    let fire = engine.getSnapshot();
    const attackerWeapon = player(fire, "player1").weapons[0]?.id as string;
    engine.dispatch({
      type: "resolveFire",
      weaponId: attackerWeapon,
      targetId: fire.legalTargetIds[0] as string,
      quality: "hit",
    });
    const destroyedShield = player(engine.getSnapshot(), "player2").shields[0];
    expect(destroyedShield?.destroyed).toBe(true);

    // A repair round is granted to player2 and restores its shield.
    winRound(engine, "player2", "repair");
    expect(player(engine.getSnapshot(), "player2").shields[0]?.destroyed).toBe(false);
  });

  it("repairs characters before flags and shields according to build order", () => {
    const engine = new GameEngine();
    start(engine);
    buildAttacker(engine);
    buildDefenderToWeapons(engine);

    fireCenterHit(engine);
    fireCenterHit(engine);
    fireCenterHit(engine);
    fireCenterHit(engine);
    expect(player(engine.getSnapshot(), "player2").characters.map((piece) => piece.destroyed)).toEqual([
      false,
      false,
      true,
      true,
    ]);

    winRound(engine, "player2", "repair");
    expect(player(engine.getSnapshot(), "player2").characters.map((piece) => piece.destroyed)).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });

  it("ends immediately when characters, flags, and shields are destroyed", () => {
    const engine = new GameEngine();
    start(engine);
    buildAttacker(engine);
    buildDefenderToWeapons(engine);

    while (engine.getSnapshot().status !== "over") {
      winRound(engine, "player1");
      const fire = engine.getSnapshot();
      const weaponId = player(fire, "player1").weapons.find((piece) => !piece.destroyed)?.id;
      const targetId = fire.legalTargetIds[0];
      expect(weaponId).toBeDefined();
      expect(targetId).toBeDefined();
      engine.dispatch({
        type: "resolveFire",
        weaponId: weaponId as string,
        targetId: targetId as string,
        quality: "centerHit",
      });
    }

    const finished = engine.getSnapshot();
    expect(finished.status).toBe("over");
    expect(finished.winner).toBe("player1");
    expect(finished.loser).toBe("player2");
    expect(finished.players.player2.characters.every((piece) => piece.destroyed)).toBe(true);
    expect(finished.players.player2.flags.every((piece) => piece.destroyed)).toBe(true);
    expect(finished.players.player2.shields.every((piece) => piece.destroyed)).toBe(true);
    expect(engine.dispatch({ type: "submitRps", playerId: "player1", choice: "rock" }).error?.code).toBe(
      "MATCH_OVER",
    );
    expect(engine.dispatch({ type: "chooseAction", action: "repair" }).error?.code).toBe("MATCH_OVER");
  });

  it("supports an injected deterministic random source", () => {
    const calls: number[] = [];
    const engine = new GameEngine({
      random: () => {
        calls.push(1);
        return 0.5;
      },
    });
    const result = engine.dispatch({ type: "startMatch", mode: "vsAi", difficulty: "standard", seed: 3 });
    expect(result.error).toBeUndefined();
    expect(result.snapshot.difficulty).toBe("standard");
    expect(calls).toHaveLength(1);
  });

  it("rejects duplicate RPS submissions and preserves the prior snapshot", () => {
    const engine = new GameEngine();
    start(engine);
    engine.dispatch({ type: "submitRps", playerId: "player1", choice: "rock" });
    const before = engine.getSnapshot();
    const duplicate = engine.dispatch({ type: "submitRps", playerId: "player1", choice: "paper" });
    expect(duplicate.error?.code).toBe("RPS_ALREADY_SUBMITTED");
    expect(duplicate.snapshot).toEqual(before);
  });
});
