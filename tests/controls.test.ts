import { beforeEach, describe, expect, it } from "vitest";
import { drawablyButton, drawablyCard } from "../src/controls.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

function mountButton(opts = {}) {
  const el = document.createElement("button");
  el.textContent = "Done";
  document.body.append(el);
  return { el, sketch: drawablyButton(el, opts) };
}

describe("drawablyButton", () => {
  it("throws on a null element", () => {
    expect(() => drawablyButton(null as unknown as HTMLElement)).toThrow();
  });

  it("injects an aria-hidden svg with 3 boil variants per layer", () => {
    const { el } = mountButton({ seed: 1 });
    const svg = el.querySelector("svg.drawably-svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    const paths = el.querySelectorAll("path.drawably-boil.drawably-outline");
    expect(paths).toHaveLength(3);
    expect(paths[0].dataset.i).toBe("0");
    expect(paths[2].dataset.i).toBe("2");
    expect(new Set([...paths].map((p) => p.getAttribute("d"))).size).toBe(3);
  });

  it("boil 0 draws a single static path per layer", () => {
    const { el } = mountButton({ seed: 1, boil: 0 });
    expect(el.querySelectorAll("path.drawably-outline")).toHaveLength(1);
    expect(el.querySelectorAll("path.drawably-boil")).toHaveLength(0);
  });

  it("draws a hand-drawn focus ring layer", () => {
    const { el } = mountButton({ seed: 1 });
    expect(el.querySelectorAll("path.drawably-focus")).toHaveLength(3);
  });

  it("sets paper and width custom properties from options", () => {
    const { el } = mountButton({ paper: "#fff", width: 3 });
    expect(el.style.getPropertyValue("--drawably-paper")).toBe("#fff");
    expect(el.style.getPropertyValue("--drawably-width")).toBe("3");
  });

  it("adds host and variant classes", () => {
    const { el } = mountButton({ seed: 1, variant: "solid" });
    expect(el.classList.contains("drawably-host")).toBe(true);
    expect(el.classList.contains("drawably-button")).toBe(true);
    expect(el.classList.contains("drawably-button--solid")).toBe(true);
  });

  it("solid variant adds a blob layer under the outline", () => {
    const { el } = mountButton({ seed: 1, variant: "solid" });
    expect(el.querySelectorAll("path")).toHaveLength(9);
    expect(el.querySelectorAll("path.drawably-blob")).toHaveLength(3);
    expect(el.querySelectorAll("path.drawably-outline")).toHaveLength(3);
  });

  it("scribble variant adds a scribble layer", () => {
    const { el } = mountButton({ seed: 1, variant: "scribble" });
    expect(el.querySelectorAll("path.drawably-scribble")).toHaveLength(3);
  });

  it("sets colour custom properties from options", () => {
    const { el } = mountButton({ stroke: "red", fill: "blue" });
    expect(el.style.getPropertyValue("--drawably-stroke")).toBe("red");
    expect(el.style.getPropertyValue("--drawably-fill")).toBe("blue");
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

  it("tone adds a tone class", () => {
    const { el } = mountButton({ seed: 1, tone: "neutral" });
    expect(el.classList.contains("drawably-button--neutral")).toBe(true);
  });

  it("state option and setState drive data-state", () => {
    const { el, sketch } = mountButton({ seed: 1, state: "loading" });
    expect(el.dataset.state).toBe("loading");
    sketch.setState("error");
    expect(el.dataset.state).toBe("error");
    sketch.setState("success");
    expect(el.dataset.state).toBe("success");
    sketch.setState("idle");
    expect(el.dataset.state).toBeUndefined();
  });

  it("destroy clears data-state", () => {
    const { el, sketch } = mountButton({ seed: 1, state: "error" });
    sketch.destroy();
    expect(el.dataset.state).toBeUndefined();
  });

  it("destroy removes the svg, classes and listeners", () => {
    const { el, sketch } = mountButton({ seed: 1 });
    sketch.destroy();
    expect(el.querySelector("svg")).toBeNull();
    expect(el.classList.contains("drawably-host")).toBe(false);
    el.dispatchEvent(new Event("pointerenter"));
    expect(el.querySelector("svg")).toBeNull();
  });
});

describe("drawablyCard", () => {
  it("draws a single outline layer and ignores pointer events", () => {
    const el = document.createElement("div");
    document.body.append(el);
    drawablyCard(el, { seed: 1 });
    expect(el.querySelectorAll("path")).toHaveLength(3);
    const d1 = el.querySelector("path")?.getAttribute("d");
    el.dispatchEvent(new Event("pointerenter"));
    expect(el.querySelector("path")?.getAttribute("d")).toBe(d1);
  });
});

import { drawablyCheckbox, drawablyDivider, drawablyInput, drawablyRadio, drawablyToggle } from "../src/controls.js";

describe("drawablyCheckbox", () => {
  function mountCheckbox(checked = false) {
    const wrap = document.createElement("span");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    wrap.append(input);
    document.body.append(wrap);
    return { wrap, input, sketch: drawablyCheckbox(wrap, { seed: 1 }) };
  }

  it("throws without an inner checkbox input", () => {
    const wrap = document.createElement("span");
    document.body.append(wrap);
    expect(() => drawablyCheckbox(wrap)).toThrow();
  });

  it("draws box outline plus a pathLength-normalised check layer", () => {
    const { wrap } = mountCheckbox();
    expect(wrap.querySelectorAll("path.drawably-outline")).toHaveLength(3);
    const checks = wrap.querySelectorAll("path.drawably-check");
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

  it("destroy removes a stale data-checked attribute", () => {
    const { wrap, sketch } = mountCheckbox(true);
    expect(wrap.hasAttribute("data-checked")).toBe(true);
    sketch.destroy();
    expect(wrap.hasAttribute("data-checked")).toBe(false);
  });
});

describe("drawablyRadio", () => {
  function mountRadio(name = "g") {
    const wrap = document.createElement("span");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    wrap.append(input);
    document.body.append(wrap);
    return { wrap, input, sketch: drawablyRadio(wrap, { seed: 1 }) };
  }

  it("throws without an inner radio input", () => {
    const wrap = document.createElement("span");
    document.body.append(wrap);
    expect(() => drawablyRadio(wrap)).toThrow();
  });

  it("draws circle outline, dot and focus layers", () => {
    const { wrap } = mountRadio();
    expect(wrap.classList.contains("drawably-radio")).toBe(true);
    expect(wrap.querySelectorAll("path.drawably-outline")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.drawably-dot")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.drawably-focus")).toHaveLength(3);
  });

  it("syncs data-checked across a group via document change events", () => {
    const a = mountRadio();
    const b = mountRadio();
    a.input.checked = true;
    a.input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(a.wrap.hasAttribute("data-checked")).toBe(true);
    b.input.checked = true;
    b.input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(a.wrap.hasAttribute("data-checked")).toBe(false);
    expect(b.wrap.hasAttribute("data-checked")).toBe(true);
  });

  it("destroy detaches the document listener", () => {
    const { wrap, input, sketch } = mountRadio();
    sketch.destroy();
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(wrap.hasAttribute("data-checked")).toBe(false);
  });
});

describe("drawablyToggle", () => {
  function mountToggle(checked = false) {
    const wrap = document.createElement("span");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    wrap.append(input);
    document.body.append(wrap);
    return { wrap, input, sketch: drawablyToggle(wrap, { seed: 1 }) };
  }

  it("draws pill outline, knob blob and focus layers", () => {
    const { wrap } = mountToggle();
    expect(wrap.classList.contains("drawably-toggle")).toBe(true);
    expect(wrap.querySelectorAll("path.drawably-outline")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.drawably-knob.drawably-blob")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.drawably-focus")).toHaveLength(3);
  });

  it("mirrors checked state to data-checked", () => {
    const { wrap, input } = mountToggle();
    input.checked = true;
    input.dispatchEvent(new Event("change"));
    expect(wrap.hasAttribute("data-checked")).toBe(true);
    input.checked = false;
    input.dispatchEvent(new Event("change"));
    expect(wrap.hasAttribute("data-checked")).toBe(false);
  });
});

describe("drawablyDivider", () => {
  it("draws a single line layer", () => {
    const el = document.createElement("hr");
    document.body.append(el);
    drawablyDivider(el, { seed: 1 });
    expect(el.classList.contains("drawably-divider")).toBe(true);
    expect(el.querySelectorAll("path.drawably-boil.drawably-outline")).toHaveLength(3);
  });
});

describe("drawablyInput", () => {
  it("throws without an inner input and draws one outline layer with one", () => {
    const bare = document.createElement("span");
    document.body.append(bare);
    expect(() => drawablyInput(bare)).toThrow();
    const wrap = document.createElement("span");
    wrap.append(document.createElement("input"));
    document.body.append(wrap);
    drawablyInput(wrap, { seed: 1 });
    expect(wrap.classList.contains("drawably-inputbox")).toBe(true);
    expect(wrap.querySelectorAll("path.drawably-outline")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.drawably-focus")).toHaveLength(3);
  });
});

import { drawablyCircle, drawablyHighlight, drawablyUnderline } from "../src/controls.js";

function mountWord() {
  const el = document.createElement("span");
  el.textContent = "price";
  document.body.append(el);
  return el;
}

describe("inline decorations", () => {
  it("underline throws on a missing element and draws one hover-resketching line layer", () => {
    expect(() => drawablyUnderline(null as unknown as HTMLElement)).toThrow();
    const el = mountWord();
    drawablyUnderline(el, { seed: 1 });
    expect(el.classList.contains("drawably-underline")).toBe(true);
    expect(el.querySelectorAll("path.drawably-boil.drawably-outline")).toHaveLength(3);
    const d1 = el.querySelector("path")?.getAttribute("d");
    el.dispatchEvent(new Event("pointerenter"));
    expect(el.querySelector("path")?.getAttribute("d")).not.toBe(d1);
  });

  it("highlight draws a scribble wash and ignores hover", () => {
    expect(() => drawablyHighlight(null as unknown as HTMLElement)).toThrow();
    const el = mountWord();
    drawablyHighlight(el, { seed: 1 });
    expect(el.classList.contains("drawably-highlight")).toBe(true);
    expect(el.querySelectorAll("path.drawably-boil.drawably-wash")).toHaveLength(3);
    const d1 = el.querySelector("path")?.getAttribute("d");
    el.dispatchEvent(new Event("pointerenter"));
    expect(el.querySelector("path")?.getAttribute("d")).toBe(d1);
  });

  it("circle draws a closed ellipse layer and re-sketches on hover", () => {
    expect(() => drawablyCircle(null as unknown as HTMLElement)).toThrow();
    const el = mountWord();
    drawablyCircle(el, { seed: 1 });
    expect(el.classList.contains("drawably-circle")).toBe(true);
    const paths = el.querySelectorAll("path.drawably-boil.drawably-outline");
    expect(paths).toHaveLength(3);
    expect(paths[0].getAttribute("d")?.match(/Z/g)).toHaveLength(2);
    const d1 = paths[0].getAttribute("d");
    el.dispatchEvent(new Event("pointerenter"));
    expect(el.querySelector("path")?.getAttribute("d")).not.toBe(d1);
  });

  it("decorations are deterministic per seed", () => {
    const a = mountWord();
    const b = mountWord();
    drawablyUnderline(a, { seed: 7 });
    drawablyUnderline(b, { seed: 7 });
    expect(a.querySelector("path")?.getAttribute("d")).toBe(b.querySelector("path")?.getAttribute("d"));
  });

  it("destroy removes svg, class and hover listener", () => {
    const el = mountWord();
    const sketch = drawablyCircle(el, { seed: 1 });
    sketch.destroy();
    expect(el.querySelector("svg")).toBeNull();
    expect(el.classList.contains("drawably-circle")).toBe(false);
    expect(el.classList.contains("drawably-host")).toBe(false);
  });
});

import { drawablyArrow } from "../src/controls.js";

describe("drawablyArrow", () => {
  function anchors() {
    const from = mountWord();
    const to = mountWord();
    return { from, to };
  }

  it("throws when either anchor is missing", () => {
    const { from } = anchors();
    expect(() => drawablyArrow(from, null as unknown as HTMLElement)).toThrow("anchor");
    expect(() => drawablyArrow(null as unknown as HTMLElement, from)).toThrow("anchor");
  });

  it("appends a body-level svg with a boiling arrow layer", () => {
    const { from, to } = anchors();
    drawablyArrow(from, to, { seed: 1 });
    const svg = document.body.querySelector(":scope > svg.drawably-svg.drawably-arrow");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.querySelectorAll("path.drawably-boil.drawably-outline")).toHaveLength(3);
    expect(from.querySelector("svg")).toBeNull();
  });

  it("is deterministic per seed and resketch changes it", () => {
    const { from, to } = anchors();
    const a = drawablyArrow(from, to, { seed: 3 });
    const d = () => document.body.querySelector("svg.drawably-arrow path")?.getAttribute("d");
    const d1 = d();
    a.resketch(4);
    expect(d()).not.toBe(d1);
    a.resketch(3);
    expect(d()).toBe(d1);
  });

  it("destroy removes the svg", () => {
    const { from, to } = anchors();
    const a = drawablyArrow(from, to, { seed: 1 });
    a.destroy();
    expect(document.body.querySelector("svg.drawably-arrow")).toBeNull();
  });
});

import { drawablyBadge, drawablyList, drawablySelect, drawablyTextarea } from "../src/controls.js";

function wrapWith(tag: string) {
  const wrap = document.createElement("span");
  wrap.append(document.createElement(tag));
  document.body.append(wrap);
  return wrap;
}

describe("drawablyTextarea", () => {
  it("throws without an inner textarea", () => {
    expect(() => drawablyTextarea(wrapWith("input"))).toThrow("textarea");
  });

  it("draws outline and focus layers", () => {
    const wrap = wrapWith("textarea");
    drawablyTextarea(wrap, { seed: 1 });
    expect(wrap.classList.contains("drawably-textarea")).toBe(true);
    expect(wrap.querySelectorAll("path.drawably-outline")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.drawably-focus")).toHaveLength(3);
  });
});

describe("drawablySelect", () => {
  it("throws without an inner select", () => {
    expect(() => drawablySelect(wrapWith("input"))).toThrow("select");
  });

  it("draws outline, chevron and focus layers", () => {
    const wrap = wrapWith("select");
    drawablySelect(wrap, { seed: 1 });
    expect(wrap.classList.contains("drawably-select")).toBe(true);
    expect(wrap.querySelectorAll("path.drawably-outline")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.drawably-chevron")).toHaveLength(3);
    expect(wrap.querySelectorAll("path.drawably-focus")).toHaveLength(3);
  });
});

describe("drawablyBadge", () => {
  it("throws on a missing element", () => {
    expect(() => drawablyBadge(null as unknown as HTMLElement)).toThrow("HTMLElement");
  });

  it("outline by default, scribble variant adds a scribble layer", () => {
    const a = mountWord();
    drawablyBadge(a, { seed: 1 });
    expect(a.classList.contains("drawably-badge")).toBe(true);
    expect(a.querySelectorAll("path.drawably-outline")).toHaveLength(3);
    expect(a.querySelectorAll("path.drawably-scribble")).toHaveLength(0);
    const b = mountWord();
    drawablyBadge(b, { seed: 1, variant: "scribble" });
    expect(b.classList.contains("drawably-badge--scribble")).toBe(true);
    expect(b.querySelectorAll("path.drawably-scribble")).toHaveLength(3);
  });

  it("ignores hover", () => {
    const el = mountWord();
    drawablyBadge(el, { seed: 1 });
    const d1 = el.querySelector("path")?.getAttribute("d");
    el.dispatchEvent(new Event("pointerenter"));
    expect(el.querySelector("path")?.getAttribute("d")).toBe(d1);
  });
});

describe("drawablyList", () => {
  function mountList(n = 3) {
    const ul = document.createElement("ul");
    for (let i = 0; i < n; i++) {
      const li = document.createElement("li");
      li.textContent = `item ${i}`;
      ul.append(li);
    }
    document.body.append(ul);
    return ul;
  }

  it("throws on a missing element", () => {
    expect(() => drawablyList(null as unknown as HTMLElement)).toThrow("HTMLElement");
  });

  it("draws a dash marker per li by default, check with marker: check", () => {
    const ul = mountList();
    drawablyList(ul, { seed: 1 });
    expect(ul.classList.contains("drawably-list")).toBe(true);
    expect(ul.querySelectorAll("li > svg.drawably-svg")).toHaveLength(3);
    expect(ul.querySelectorAll("path.drawably-marker")).toHaveLength(9);
    expect(ul.querySelector(":scope > svg")).toBeNull();
    const ol = mountList(2);
    drawablyList(ol, { seed: 1, marker: "check" });
    const check = ol.querySelector("path.drawably-marker")?.getAttribute("d");
    const dash = ul.querySelector("path.drawably-marker")?.getAttribute("d");
    expect(check?.match(/M/g)).toHaveLength(1);
    expect(dash?.match(/M/g)).toHaveLength(2);
  });

  it("gives each li a different sketch, deterministic per seed", () => {
    const a = mountList(2);
    const b = mountList(2);
    drawablyList(a, { seed: 5 });
    drawablyList(b, { seed: 5 });
    const ds = (ul: HTMLElement) => [...ul.querySelectorAll("li")].map((li) => li.querySelector("path")?.getAttribute("d"));
    expect(ds(a)).toEqual(ds(b));
    expect(ds(a)[0]).not.toBe(ds(a)[1]);
  });

  it("resketch redraws every li and destroy removes everything", () => {
    const ul = mountList(2);
    const sketch = drawablyList(ul, { seed: 1 });
    const d = () => [...ul.querySelectorAll("li")].map((li) => li.querySelector("path")?.getAttribute("d"));
    const before = d();
    sketch.resketch(2);
    const after = d();
    expect(after[0]).not.toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
    sketch.destroy();
    expect(ul.querySelector("svg")).toBeNull();
    expect(ul.classList.contains("drawably-list")).toBe(false);
    expect(ul.querySelector("li.drawably-host")).toBeNull();
  });
});

describe("drawablySelect sizing and picker", () => {
  function mountSelect(labels = ["Pen", "Pencil", "Marker"]) {
    const wrap = document.createElement("span");
    const select = document.createElement("select");
    for (const l of labels) {
      const o = document.createElement("option");
      o.textContent = l;
      select.append(o);
    }
    wrap.append(select);
    document.body.append(wrap);
    return { wrap, select };
  }

  it("reserves the widest option's width so choosing another never shifts layout", () => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // ponytail: happy-dom has no canvas; 7px per character stands in for a font
    HTMLCanvasElement.prototype.getContext = (() => ({
      measureText: (t: string) => ({ width: t.length * 7 }),
    })) as unknown as typeof orig;
    try {
      const { select } = mountSelect();
      drawablySelect(select.parentElement!, { seed: 1 });
      expect(select.style.minWidth).toBe("42px");
    } finally {
      HTMLCanvasElement.prototype.getContext = orig;
    }
  });

  it("puts a sketched frame inside the select for Chromium's picker, removed on destroy", () => {
    const { select } = mountSelect();
    const sketch = drawablySelect(select.parentElement!, { seed: 1 });
    const frame = select.querySelector("svg.drawably-svg.drawably-picker");
    expect(frame).not.toBeNull();
    expect([...select.options].map((o) => o.text)).toEqual(["Pen", "Pencil", "Marker"]);
    sketch.destroy();
    expect(select.querySelector("svg")).toBeNull();
  });
});
