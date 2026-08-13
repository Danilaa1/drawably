import { expect, it } from "vitest";
import * as scrawl from "../src/index.js";

it("exports the public surface", () => {
  for (const name of [
    "scrawlButton",
    "scrawlCheckbox",
    "scrawlInput",
    "scrawlCard",
    "roughLine",
    "roughRoundedRect",
    "roughCheckmark",
    "scribbleFill",
    "variants",
    "mulberry32",
    "randomSeed",
  ])
    expect(scrawl, name).toHaveProperty(name);
});
