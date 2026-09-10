import { beforeEach, describe, expect, it } from "vitest";
import {
  drawablyAlert,
  drawablyChip,
  drawablyKbd,
  drawablyPager,
  drawablyQuote,
  drawablySteps,
  drawablyTabs,
  drawablyTooltip,
} from "../src/composites.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

function mount(html: string) {
  document.body.innerHTML = html;
  return document.body.firstElementChild as HTMLElement;
}

const svgs = (el: Element) => el.querySelectorAll("svg.drawably-svg").length;

describe("drawablyChip", () => {
  it("badges the chip and boxes the checkbox wrapper", () => {
    const el = mount(`<label><span><input type="checkbox" checked /></span> pen</label>`);
    const sketch = drawablyChip(el, { seed: 1 });
    expect(el.classList.contains("drawably-chip")).toBe(true);
    expect(el.classList.contains("drawably-badge")).toBe(true);
    expect(el.querySelector("span")?.classList.contains("drawably-checkbox")).toBe(true);
    expect(el.querySelector("span")?.dataset.checked).toBe("");
    sketch.destroy();
    expect(svgs(el)).toBe(0);
    expect(el.className).toBe("");
  });

  it("throws when the checkbox has no wrapper of its own", () => {
    const el = mount(`<label><input type="checkbox" /> pen</label>`);
    expect(() => drawablyChip(el)).toThrow(/wrapper/);
  });
});

describe("drawablyTabs", () => {
  it("underlines the aria-selected tab and moves on setActive", () => {
    const el = mount(`<div><span>a</span><span aria-selected="true">b</span><span>c</span></div>`);
    const tabs = [...el.children] as HTMLElement[];
    const sketch = drawablyTabs(el, { seed: 1 });
    expect(tabs[1].classList.contains("drawably-underline")).toBe(true);
    sketch.setActive(2);
    expect(tabs[1].classList.contains("drawably-underline")).toBe(false);
    expect(tabs[2].classList.contains("drawably-underline")).toBe(true);
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
    sketch.destroy();
    expect(svgs(el)).toBe(0);
  });
});

describe("drawablyTooltip", () => {
  it("cards the tip and draws an arrow to the target", () => {
    mount(`<div><span id="tip">undo</span><button id="t">Done</button></div>`);
    const tip = document.getElementById("tip")!;
    const sketch = drawablyTooltip(tip, document.getElementById("t")!, { seed: 1 });
    expect(tip.classList.contains("drawably-card")).toBe(true);
    expect(document.body.querySelector("svg.drawably-arrow")).not.toBeNull();
    sketch.destroy();
    expect(document.body.querySelector("svg.drawably-arrow")).toBeNull();
  });
});

describe("drawablyAlert", () => {
  it("cards the box and badges a data-tag child when present", () => {
    const el = mount(`<div><span data-tag>new</span> hello</div>`);
    const sketch = drawablyAlert(el, { seed: 1 });
    expect(el.classList.contains("drawably-card")).toBe(true);
    expect(el.querySelector("[data-tag]")?.classList.contains("drawably-badge")).toBe(true);
    sketch.destroy();
    expect(svgs(el)).toBe(0);
  });

  it("works without a tag", () => {
    const el = mount(`<div>hello</div>`);
    drawablyAlert(el, { seed: 1 });
    expect(svgs(el)).toBe(1);
  });
});

describe("drawablySteps / drawablyKbd / drawablyQuote", () => {
  it("steps is a check-marked list", () => {
    const el = mount(`<ol><li>a</li><li>b</li></ol>`);
    drawablySteps(el, { seed: 1 });
    expect(el.classList.contains("drawably-list")).toBe(true);
    expect(el.querySelectorAll("path.drawably-marker").length).toBeGreaterThan(0);
  });

  it("kbd is a badge with a steadier hand", () => {
    const el = mount(`<kbd>⌘K</kbd>`);
    drawablyKbd(el, { seed: 1 });
    expect(el.classList.contains("drawably-badge")).toBe(true);
    expect(el.classList.contains("drawably-kbd")).toBe(true);
  });

  it("quote highlights the first child and rules the footer", () => {
    const el = mount(`<blockquote><span>less</span><footer>me</footer></blockquote>`);
    const sketch = drawablyQuote(el, { seed: 1 });
    expect(el.querySelector("span")?.classList.contains("drawably-highlight")).toBe(true);
    expect(el.querySelector("footer")?.classList.contains("drawably-divider")).toBe(true);
    sketch.destroy();
    expect(svgs(el)).toBe(0);
  });
});

describe("drawablyPager", () => {
  it("makes the current page solid and swaps on setPage", () => {
    const el = mount(`<nav><button>‹</button><button aria-current="page">1</button><button>›</button></nav>`);
    const [a, b, c] = [...el.children] as HTMLElement[];
    const sketch = drawablyPager(el, { seed: 1 });
    expect(b.classList.contains("drawably-button--solid")).toBe(true);
    expect(a.classList.contains("drawably-button--outline")).toBe(true);
    sketch.setPage(2);
    expect(b.classList.contains("drawably-button--solid")).toBe(false);
    expect(c.classList.contains("drawably-button--solid")).toBe(true);
    expect(c.getAttribute("aria-current")).toBe("page");
    expect(b.hasAttribute("aria-current")).toBe(false);
    sketch.destroy();
    expect(svgs(el)).toBe(0);
  });

  it("resketch is deterministic per seed", () => {
    const el = mount(`<nav><button>1</button><button>2</button></nav>`);
    const sketch = drawablyPager(el, { seed: 7 });
    const d = () => el.querySelector("path")!.getAttribute("d");
    const first = d();
    sketch.resketch(9);
    expect(d()).not.toBe(first);
    sketch.resketch(7);
    expect(d()).toBe(first);
  });
});
