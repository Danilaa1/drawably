import {
  type DrawablyBadgeOptions,
  type DrawablyOptions,
  drawablyArrow,
  drawablyBadge,
  drawablyButton,
  drawablyCard,
  drawablyCheckbox,
  drawablyDivider,
  drawablyHighlight,
  drawablyList,
  drawablyUnderline,
  type Sketch,
} from "./controls.js";
import { randomSeed } from "./prng.js";

// composites: several pen strokes on one piece, seeded from one base so a
// chosen seed reproduces the whole thing, torn down together

function group(el: HTMLElement, cls: string, parts: Sketch[]): Sketch {
  el.classList.add(cls);
  return {
    resketch(s?: number) {
      const base = s ?? randomSeed();
      parts.forEach((p, i) => p.resketch(base + i));
    },
    destroy() {
      for (const p of parts) p.destroy();
      el.classList.remove(cls);
    },
  };
}

const seeded = (opts: DrawablyOptions, k: number) => ({ ...opts, seed: (opts.seed ?? randomSeed()) + k });

function need(el: HTMLElement, cls: string): void {
  if (!(el instanceof HTMLElement)) throw new Error(`drawably: ${cls} expected an HTMLElement`);
}

// badge around the whole chip, checkbox on the input's own wrapper
export function drawablyChip(el: HTMLElement, opts: DrawablyOptions = {}): Sketch {
  need(el, "chip");
  const box = el.querySelector<HTMLInputElement>('input[type="checkbox"]')?.parentElement;
  if (!box || box === el) throw new Error('drawably: chip needs <input type="checkbox"> inside its own wrapper element');
  const base = seeded(opts, 0);
  return group(el, "drawably-chip", [drawablyBadge(el, base), drawablyCheckbox(box, seeded(base, 1))]);
}

export interface DrawablyTabsOptions extends DrawablyOptions {
  active?: number;
}

export interface TabsSketch extends Sketch {
  setActive(index: number): void;
}

// underline follows the active tab: the index given, else the child with
// aria-selected="true", else the first
export function drawablyTabs(el: HTMLElement, opts: DrawablyTabsOptions = {}): TabsSketch {
  need(el, "tabs");
  const tabs = [...el.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
  if (!tabs.length) throw new Error("drawably: tabs needs child elements");
  const base = seeded(opts, 0);
  let line: Sketch | null = null;
  let seed = base.seed;
  const setActive = (index: number) => {
    line?.destroy();
    const tab = tabs[Math.max(0, Math.min(tabs.length - 1, index))];
    for (const t of tabs) t.setAttribute("aria-selected", String(t === tab));
    line = drawablyUnderline(tab, { ...base, seed });
  };
  setActive(opts.active ?? Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true")));
  el.classList.add("drawably-tabs");
  return {
    setActive,
    resketch(s?: number) {
      seed = s ?? randomSeed();
      line?.resketch(seed);
    },
    destroy() {
      line?.destroy();
      el.classList.remove("drawably-tabs");
    },
  };
}

// card around the tip, arrow from it to the target
export function drawablyTooltip(tip: HTMLElement, target: HTMLElement, opts: DrawablyOptions = {}): Sketch {
  need(tip, "tooltip");
  need(target, "tooltip");
  const base = seeded(opts, 0);
  return group(tip, "drawably-tooltip", [drawablyCard(tip, base), drawablyArrow(tip, target, seeded(base, 1))]);
}

// card around the alert, badge on an optional [data-tag] child
export function drawablyAlert(el: HTMLElement, opts: DrawablyOptions = {}): Sketch {
  need(el, "alert");
  const base = seeded(opts, 0);
  const parts = [drawablyCard(el, base)];
  const tag = el.querySelector<HTMLElement>(":scope > [data-tag]");
  if (tag) parts.push(drawablyBadge(tag, seeded(base, 1)));
  return group(el, "drawably-alert", parts);
}

export function drawablySteps(el: HTMLElement, opts: DrawablyOptions = {}): Sketch {
  need(el, "steps");
  return group(el, "drawably-steps", [drawablyList(el, { ...opts, marker: "check" })]);
}

// keys are drawn with a steadier hand than prose
const KBD_ROUGHNESS = 0.6;

export function drawablyKbd(el: HTMLElement, opts: DrawablyBadgeOptions = {}): Sketch {
  need(el, "kbd");
  return group(el, "drawably-kbd", [drawablyBadge(el, { ...opts, roughness: (opts.roughness ?? 1) * KBD_ROUGHNESS })]);
}

// highlight on the first element child, divider on an optional <footer>
export function drawablyQuote(el: HTMLElement, opts: DrawablyOptions = {}): Sketch {
  need(el, "quote");
  const line = el.firstElementChild;
  if (!(line instanceof HTMLElement)) throw new Error("drawably: quote needs an element child to highlight");
  const base = seeded(opts, 0);
  const parts = [drawablyHighlight(line, base)];
  const foot = el.querySelector<HTMLElement>(":scope > footer");
  if (foot) parts.push(drawablyDivider(foot, seeded(base, 1)));
  return group(el, "drawably-quote", parts);
}

export interface DrawablyPagerOptions extends DrawablyOptions {
  active?: number;
}

export interface PagerSketch extends Sketch {
  setPage(index: number): void;
}

// every child button is outlined; the current page is solid. changing page
// redraws only the two buttons that swap
export function drawablyPager(el: HTMLElement, opts: DrawablyPagerOptions = {}): PagerSketch {
  need(el, "pager");
  const buttons = [...el.querySelectorAll<HTMLElement>(":scope > button")];
  if (!buttons.length) throw new Error("drawably: pager needs child <button>s");
  const base = seeded(opts, 0);
  let seed = base.seed;
  let current = opts.active ?? Math.max(0, buttons.findIndex((b) => b.hasAttribute("aria-current")));
  // a button sketch keeps its variant class after destroy; the pager owns the swap
  const clear = (i: number) => buttons[i].classList.remove("drawably-button--solid", "drawably-button--outline");
  const draw = (i: number) =>
    drawablyButton(buttons[i], { ...base, seed: seed + i, variant: i === current ? "solid" : "outline" });
  const parts = buttons.map((_, i) => draw(i));
  const setPage = (index: number) => {
    const next = Math.max(0, Math.min(buttons.length - 1, index));
    if (next === current) return;
    const prev = current;
    current = next;
    for (const i of [prev, next]) {
      parts[i].destroy();
      clear(i);
      parts[i] = draw(i);
    }
    for (const [i, b] of buttons.entries()) {
      if (i === current) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    }
  };
  buttons.forEach((b, i) => (i === current ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current")));
  el.classList.add("drawably-pager");
  return {
    setPage,
    resketch(s?: number) {
      seed = s ?? randomSeed();
      parts.forEach((p, i) => p.resketch(seed + i));
    },
    destroy() {
      for (const p of parts) p.destroy();
      buttons.forEach((_, i) => clear(i));
      el.classList.remove("drawably-pager");
    },
  };
}
