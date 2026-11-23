import { describe, expect, it } from "vitest";
import {
  AiPolicy,
  createAiPolicy,
  createSeededRandom,
} from "./index.js";
import {
  GameEngine,
  type Action,
  type PlayerId,
  type PublicGameSnapshot,
} from "../engine/index.js";

function start(engine: GameEngine, difficulty: "easy" | "standard" = "standard"): void {
  expect(
    engine.dispatch({
      type: "startMatch",
      mode: "vsAi",
      difficulty,
      seed: 11,
    }).error,
  ).toBeUndefined();
}

function winRound(engine: GameEngine, winner: PlayerId): void {
  const player1Choice = winner === "player1" ? "rock" : "scissors";
  const player2Choice = winner === "player1" ? "scissors" : "rock";
  expect(
    engine.dispatch({ type: "submitRps", playerId: "player1", choice: player1Choice }).error,
  ).toBeUndefined();
  expect(
    engine.dispatch({ type: "submitRps", playerId: "player2", choice: player2Choice }).error,
  ).toBeUndefined();
}

function build(
  engine: GameEngine,
  player: PlayerId,
  action: Action,
  count: number,
): void {
  for (let index = 0; index < count; index += 1) {
    winRound(engine, player);
    expect(engine.dispatch({ type: "chooseAction", action }).error).toBeUndefined();
  }
}

function buildBattlefield(engine: GameEngine, defenderShields = 2): void {
  build(engine, "player1", "writeCharacter", 4);
  build(engine, "player1", "plantFlag", 3);
  build(engine, "player1", "raiseShield", 1);
  build(engine, "player1", "deployCannon", 3);
  build(engine, "player2", "writeCharacter", 4);
  build(engine, "player2", "plantFlag", 3);
  build(engine, "player2", "raiseShield", defenderShields);
}

function player(snapshot: PublicGameSnapshot, id: PlayerId) {
  return snapshot.players[id];
}

describe("AI policy", () => {
  it("chooses a statistically uniform RPS throw without reading the snapshot", () => {
    const policy = new AiPolicy({
      difficulty: "standard",
      random: createSeededRandom(42),
    });
    const counts = { rock: 0, paper: 0, scissors: 0 };
    const firstSnapshot = { pendingRps: [] } as unknown as PublicGameSnapshot;
    const secondSnapshot = { pendingRps: ["player1"] } as unknown as PublicGameSnapshot;

    for (let round = 0; round < 10_000; round += 1) {
      const choice = policy.chooseRps(round % 2 === 0 ? firstSnapshot : secondSnapshot);
      counts[choice] += 1;
    }

    expect(counts.rock).toBeGreaterThan(3_100);
    expect(counts.paper).toBeGreaterThan(3_100);
    expect(counts.scissors).toBeGreaterThan(3_100);
    expect(counts.rock).toBeLessThan(3_550);
    expect(counts.paper).toBeLessThan(3_550);
    expect(counts.scissors).toBeLessThan(3_550);
  });

  it("repairs before building when Standard has repairable damage", () => {
    const engine = new GameEngine({ random: createSeededRandom(5) });
    start(engine);
    buildBattlefield(engine, 1);

    winRound(engine, "player1");
    const attack = engine.getSnapshot();
    const weaponId = player(attack, "player1").weapons[0]?.id;
    const targetId = attack.legalTargetIds[0];
    expect(weaponId).toBeDefined();
    expect(targetId).toBeDefined();
    expect(
      engine.dispatch({
        type: "resolveFire",
        weaponId: weaponId as string,
        targetId: targetId as string,
        quality: "hit",
      }).error,
    ).toBeUndefined();

    winRound(engine, "player2");
    const policy = createAiPolicy({
      difficulty: "standard",
      playerId: "player2",
      random: createSeededRandom(9),
    });
    const command = policy.chooseCommand(engine.getSnapshot());
    expect(command).toEqual({ type: "chooseAction", action: "repair" });
    expect(command === undefined ? undefined : engine.dispatch(command).error).toBeUndefined();
  });

  it("chooses the maximum visible cascade target more often than Easy", () => {
    const engine = new GameEngine({ random: createSeededRandom(6) });
    start(engine);
    buildBattlefield(engine, 3);
    winRound(engine, "player1");
    const snapshot = engine.getSnapshot();
    const outermostTarget = snapshot.legalTargetIds[0];
    expect(snapshot.legalTargetIds.length).toBe(3);
    expect(outermostTarget).toBeDefined();

    const standard = createAiPolicy({
      difficulty: "standard",
      playerId: "player1",
      random: createSeededRandom(1),
    });
    let standardBest = 0;
    for (let index = 0; index < 100; index += 1) {
      if (standard.chooseFire(snapshot)?.targetId === outermostTarget) standardBest += 1;
    }

    let easyBest = 0;
    for (let seed = 0; seed < 100; seed += 1) {
      const easy = createAiPolicy({
        difficulty: "easy",
        playerId: "player1",
        random: createSeededRandom(seed),
      });
      if (easy.chooseFire(snapshot)?.targetId === outermostTarget) easyBest += 1;
    }

    expect(standardBest).toBe(100);
    expect(easyBest).toBeLessThan(standardBest);
  });

  it.each(["easy", "standard"] as const)(
    "never emits an illegal command during a seeded full match (%s)",
    (difficulty) => {
      const engine = new GameEngine({ random: createSeededRandom(123) });
      start(engine, difficulty);
      const player1Policy = createAiPolicy({
        difficulty: "easy",
        playerId: "player1",
        random: createSeededRandom(456),
      });
      const player2Policy = createAiPolicy({
        difficulty,
        playerId: "player2",
        random: createSeededRandom(789),
      });

      for (let step = 0; step < 10_000 && engine.getSnapshot().status !== "over"; step += 1) {
        const snapshot = engine.getSnapshot();
        if (snapshot.status === "rps") {
          const first = player1Policy.chooseCommand(snapshot);
          expect(first?.type).toBe("submitRps");
          const afterFirst = engine.dispatch(first as Extract<typeof first, { type: "submitRps" }>);
          expect(afterFirst.error).toBeUndefined();
          const second = player2Policy.chooseCommand(afterFirst.snapshot);
          expect(second?.type).toBe("submitRps");
          expect(engine.dispatch(second as Extract<typeof second, { type: "submitRps" }>).error).toBeUndefined();
          continue;
        }

        const policy = snapshot.turnPlayer === "player1" ? player1Policy : player2Policy;
        const command = policy.chooseCommand(snapshot);
        expect(command).toBeDefined();
        expect(engine.dispatch(command as NonNullable<typeof command>).error).toBeUndefined();
      }

      expect(engine.getSnapshot().status).toBe("over");
    },
  );

  it("is deterministic for the same injected seed", () => {
    const first = createAiPolicy({
      difficulty: "easy",
      random: createSeededRandom(999),
    });
    const second = createAiPolicy({
      difficulty: "easy",
      random: createSeededRandom(999),
    });

    expect(Array.from({ length: 100 }, () => first.chooseRps())).toEqual(
      Array.from({ length: 100 }, () => second.chooseRps()),
    );
  });
});
