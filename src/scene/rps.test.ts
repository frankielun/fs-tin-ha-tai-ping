import { describe, expect, it } from "vitest";
import { RPS_LABELS, rpsHandShape } from "./rps";

describe("RPS hand presentation", () => {
  it("maps the engine choices to the Traditional Chinese input labels", () => {
    expect(RPS_LABELS).toEqual({ paper: "包", scissors: "剪", rock: "揼" });
  });

  it("maps each engine choice to its exaggerated low-poly shape", () => {
    expect(rpsHandShape("paper")).toBe("flatPalm");
    expect(rpsHandShape("rock")).toBe("roundedFist");
    expect(rpsHandShape("scissors")).toBe("twoProngs");
  });
});
