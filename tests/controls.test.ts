import { beforeEach, describe, expect, it } from "vitest";
import { scrawlButton, scrawlCard } from "../src/controls.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

function mountButton(opts = {}) {
  const el = document.createElement("button");
  el.textContent = "Done";
  document.body.append(el);
  return { el, sketch: scrawlButton(el, opts) };
}

describe("scrawlButton", () => {
  it("throws on a null element", () => {
    expect(() => scrawlButton(null as unknown as HTMLElement)).toThrow();
  });

  it("injects an aria-hidden svg with 3 boil variants per layer", () => {
    const { el } = mountButton({ seed: 1 });
    const svg = el.querySelector("svg.scrawl-svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    const paths = el.querySelectorAll("path.scrawl-boil");
    expect(paths).toHaveLength(3);
    expect(paths[0].dataset.i).toBe("0");
    expect(paths[2].dataset.i).toBe("2");
    expect(new Set([...paths].map((p) => p.getAttribute("d"))).size).toBe(3);
  });

  it("adds host and variant classes", () => {
    const { el } = mountButton({ seed: 1, variant: "solid" });
    expect(el.classList.contains("scrawl-host")).toBe(true);
    expect(el.classList.contains("scrawl-button")).toBe(true);
    expect(el.classList.contains("scrawl-button--solid")).toBe(true);
  });

  it("solid variant adds a blob layer under the outline", () => {
    const { el } = mountButton({ seed: 1, variant: "solid" });
    expect(el.querySelectorAll("path")).toHaveLength(6);
    expect(el.querySelectorAll("path.scrawl-blob")).toHaveLength(3);
    expect(el.querySelectorAll("path.scrawl-outline")).toHaveLength(3);
  });

  it("scribble variant adds a scribble layer", () => {
    const { el } = mountButton({ seed: 1, variant: "scribble" });
    expect(el.querySelectorAll("path.scrawl-scribble")).toHaveLength(3);
  });

  it("sets colour custom properties from options", () => {
    const { el } = mountButton({ stroke: "red", fill: "blue" });
    expect(el.style.getPropertyValue("--scrawl-stroke")).toBe("red");
    expect(el.style.getPropertyValue("--scrawl-fill")).toBe("blue");
  });

  it("resketch is deterministic per seed and changes the drawing", () => {
    const { el, sketch } = mountButton({ seed: 1 });
    const d = () => el.querySelector("path")?.getAttribute("d");
    const d1 = d();
    sketch.resketch(2);
    const d2 = d();
    expect(d2).not.toBe(d1);
    sketch.resketch(1);
    expect(d()).toBe(d1);
  });

  it("re-sketches on pointerenter and pointerdown", () => {
    const { el } = mountButton({ seed: 1 });
    const d = () => el.querySelector("path")?.getAttribute("d");
    const d1 = d();
    el.dispatchEvent(new Event("pointerenter"));
    const d2 = d();
    expect(d2).not.toBe(d1);
    el.dispatchEvent(new Event("pointerdown"));
    expect(d()).not.toBe(d2);
  });

  it("destroy removes the svg, classes and listeners", () => {
    const { el, sketch } = mountButton({ seed: 1 });
    sketch.destroy();
    expect(el.querySelector("svg")).toBeNull();
    expect(el.classList.contains("scrawl-host")).toBe(false);
    el.dispatchEvent(new Event("pointerenter"));
    expect(el.querySelector("svg")).toBeNull();
  });
});

describe("scrawlCard", () => {
  it("draws a single outline layer and ignores pointer events", () => {
    const el = document.createElement("div");
    document.body.append(el);
    scrawlCard(el, { seed: 1 });
    expect(el.querySelectorAll("path")).toHaveLength(3);
    const d1 = el.querySelector("path")?.getAttribute("d");
    el.dispatchEvent(new Event("pointerenter"));
    expect(el.querySelector("path")?.getAttribute("d")).toBe(d1);
  });
});

import { scrawlCheckbox, scrawlInput } from "../src/controls.js";

describe("scrawlCheckbox", () => {
  function mountCheckbox(checked = false) {
    const wrap = document.createElement("span");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    wrap.append(input);
    document.body.append(wrap);
    return { wrap, input, sketch: scrawlCheckbox(wrap, { seed: 1 }) };
  }

  it("throws without an inner checkbox input", () => {
    const wrap = document.createElement("span");
    document.body.append(wrap);
    expect(() => scrawlCheckbox(wrap)).toThrow();
  });

  it("draws box outline plus a pathLength-normalised check layer", () => {
    const { wrap } = mountCheckbox();
    expect(wrap.querySelectorAll("path.scrawl-outline")).toHaveLength(3);
    const checks = wrap.querySelectorAll("path.scrawl-check");
    expect(checks).toHaveLength(3);
    for (const p of checks) expect(p.getAttribute("pathLength")).toBe("1");
  });

  it("mirrors checked state to data-checked", () => {
    const { wrap, input } = mountCheckbox();
    expect(wrap.hasAttribute("data-checked")).toBe(false);
    input.checked = true;
    input.dispatchEvent(new Event("change"));
    expect(wrap.hasAttribute("data-checked")).toBe(true);
    input.checked = false;
    input.dispatchEvent(new Event("change"));
    expect(wrap.hasAttribute("data-checked")).toBe(false);
  });

  it("reflects an initially checked input", () => {
    const { wrap } = mountCheckbox(true);
    expect(wrap.hasAttribute("data-checked")).toBe(true);
  });

  it("destroy detaches the change listener", () => {
    const { wrap, input, sketch } = mountCheckbox();
    sketch.destroy();
    input.checked = true;
    input.dispatchEvent(new Event("change"));
    expect(wrap.hasAttribute("data-checked")).toBe(false);
  });
});

describe("scrawlInput", () => {
  it("throws without an inner input and draws one outline layer with one", () => {
    const bare = document.createElement("span");
    document.body.append(bare);
    expect(() => scrawlInput(bare)).toThrow();
    const wrap = document.createElement("span");
    wrap.append(document.createElement("input"));
    document.body.append(wrap);
    scrawlInput(wrap, { seed: 1 });
    expect(wrap.classList.contains("scrawl-inputbox")).toBe(true);
    expect(wrap.querySelectorAll("path")).toHaveLength(3);
  });
});
