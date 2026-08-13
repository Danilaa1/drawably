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
