import type { RpsChoice } from "../engine/index";

export type RpsHandShape = "flatPalm" | "roundedFist" | "twoProngs";

export const RPS_LABELS: Readonly<Record<RpsChoice, string>> = {
  paper: "包",
  scissors: "剪",
  rock: "揼",
};

export function rpsHandShape(choice: RpsChoice): RpsHandShape {
  switch (choice) {
    case "paper":
      return "flatPalm";
    case "rock":
      return "roundedFist";
    case "scissors":
      return "twoProngs";
  }
}
