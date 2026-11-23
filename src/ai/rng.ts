import type { RandomSource } from "../engine/contracts.js";

/**
 * A small deterministic source for policy fixtures and replayable matches.
 *
 * The policy does not depend on this implementation at runtime: callers can
 * inject any RandomSource with the same [0, 1) contract.
 */
export function createSeededRandom(seed: number): RandomSource {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}
