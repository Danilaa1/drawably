import { expect, it } from "vitest";
import * as drawably from "../src/index.js";

it("exports the public surface", () => {
  for (const name of [
    "drawablyButton",
    "drawablyCheckbox",
    "drawablyInput",
    "drawablyCard",
    "drawablyUnderline",
    "drawablyHighlight",
    "drawablyCircle",
    "drawablyArrow",
    "drawablyTextarea",
    "drawablySelect",
    "drawablyBadge",
    "drawablyList",
    "roughEllipse",
    "roughArrow",
    "roughLine",
    "roughRoundedRect",
    "roughCheckmark",
    "scribbleFill",
    "variants",
    "mulberry32",
    "randomSeed",
  ])
    expect(drawably, name).toHaveProperty(name);
});
