import { randomSeed } from "./prng.js";
import {
  type RoughOptions,
  roughCheckmark,
  roughCircle,
  roughLine,
  roughRoundedRect,
  scribbleFill,
  variants,
} from "./rough.js";

export interface DrawablyOptions {
  seed?: number;
  roughness?: number;
  boil?: number;
  stroke?: string;
  fill?: string;
  paper?: string;
  width?: number;
}

export interface Sketch {
  resketch(seed?: number): void;
  destroy(): void;
}

interface Layer {
  className: string;
  pathLength?: boolean;
  gen(w: number, h: number, o: RoughOptions): string;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const INSET = 3;

function attachChrome(
  el: HTMLElement,
  layers: Layer[],
  opts: DrawablyOptions,
  interactive: boolean,
): Sketch {
  if (!(el instanceof HTMLElement)) throw new Error("drawably: expected an HTMLElement");
  el.classList.add("drawably-host");
  if (opts.stroke) el.style.setProperty("--drawably-stroke", opts.stroke);
  if (opts.fill) el.style.setProperty("--drawably-fill", opts.fill);
  if (opts.paper) el.style.setProperty("--drawably-paper", opts.paper);
  if (opts.width !== undefined) el.style.setProperty("--drawably-width", String(opts.width));

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "drawably-svg");
  svg.setAttribute("aria-hidden", "true");
  el.prepend(svg);

  const roughness = opts.roughness ?? 1;
  const boil = opts.boil ?? 0.3;
  let seed = opts.seed ?? randomSeed();

  function draw() {
    const w = el.offsetWidth || 120;
    const h = el.offsetHeight || 36;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.textContent = "";
    for (const layer of layers) {
      const ds = variants((o) => layer.gen(w, h, o), { seed, roughness, boil }, boil > 0 ? 3 : 1);
      ds.forEach((d, i) => {
        const p = document.createElementNS(SVG_NS, "path");
        p.setAttribute("d", d);
        p.setAttribute("class", ds.length > 1 ? `drawably-boil ${layer.className}` : layer.className);
        p.dataset.i = String(i);
        if (layer.pathLength) p.setAttribute("pathLength", "1");
        svg.append(p);
      });
    }
  }

  draw();

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => draw()) : null;
  ro?.observe(el);

  const resketch = (s?: number) => {
    seed = s ?? randomSeed();
    draw();
  };

  const reduced =
    typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onPointer = () => resketch();
  if (interactive && !reduced) {
    el.addEventListener("pointerenter", onPointer);
    el.addEventListener("pointerdown", onPointer);
  }

  return {
    resketch,
    destroy() {
      ro?.disconnect();
      el.removeEventListener("pointerenter", onPointer);
      el.removeEventListener("pointerdown", onPointer);
      svg.remove();
      el.classList.remove("drawably-host");
    },
  };
}

const outlineRect =
  (r: number): Layer["gen"] =>
  (w, h, o) =>
    roughRoundedRect(INSET, INSET, w - 2 * INSET, h - 2 * INSET, r, o);

const focusRect =
  (r: number): Layer["gen"] =>
  (w, h, o) =>
    roughRoundedRect(-1, -1, w + 2, h + 2, r, o);

export type DrawablyButtonState = "idle" | "loading" | "error" | "success";

export interface DrawablyButtonOptions extends DrawablyOptions {
  variant?: "outline" | "solid" | "scribble";
  state?: DrawablyButtonState;
  tone?: "neutral" | "danger";
}

export interface ButtonSketch extends Sketch {
  setState(state: DrawablyButtonState): void;
}

export function drawablyButton(el: HTMLElement, opts: DrawablyButtonOptions = {}): ButtonSketch {
  const variant = opts.variant ?? "outline";
  const layers: Layer[] = [];
  if (variant === "solid") layers.push({ className: "drawably-blob", gen: outlineRect(8) });
  if (variant === "scribble")
    layers.push({
      className: "drawably-scribble",
      gen: (w, h, o) => scribbleFill(INSET + 2, INSET + 2, w - 2 * INSET - 4, h - 2 * INSET - 4, o),
    });
  layers.push({ className: "drawably-outline", gen: outlineRect(8) });
  layers.push({ className: "drawably-focus", gen: focusRect(10) });
  const sketch = attachChrome(el, layers, opts, true);
  el.classList.add("drawably-button", `drawably-button--${variant}`);
  if (opts.tone) el.classList.add(`drawably-button--${opts.tone}`);
  const setState = (state: DrawablyButtonState) => {
    if (state === "idle") delete el.dataset.state;
    else el.dataset.state = state;
  };
  if (opts.state) setState(opts.state);
  return {
    resketch: sketch.resketch,
    setState,
    destroy() {
      sketch.destroy();
      delete el.dataset.state;
    },
  };
}

export function drawablyCard(el: HTMLElement, opts: DrawablyOptions = {}): Sketch {
  const sketch = attachChrome(el, [{ className: "drawably-outline", gen: outlineRect(10) }], opts, false);
  el.classList.add("drawably-card");
  return sketch;
}

function syncedControl(
  el: HTMLElement,
  type: "checkbox" | "radio",
  layers: Layer[],
  opts: DrawablyOptions,
  cls: string,
): Sketch {
  const input = el?.querySelector?.<HTMLInputElement>(`input[type="${type}"]`);
  if (!input) throw new Error(`drawably: ${cls} wrapper needs an <input type="${type}">`);
  const sync = () => {
    if (input.checked) el.dataset.checked = "";
    else delete el.dataset.checked;
  };
  sync();
  // ponytail: a radio unchecks silently when a sibling is picked — one document
  // listener re-reads state on any change instead of tracking the group
  const target = type === "radio" ? document : input;
  target.addEventListener("change", sync);
  const sketch = attachChrome(el, layers, opts, true);
  el.classList.add(cls);
  return {
    resketch: sketch.resketch,
    destroy() {
      target.removeEventListener("change", sync);
      sketch.destroy();
      el.classList.remove(cls);
      delete el.dataset.checked;
    },
  };
}

export function drawablyCheckbox(el: HTMLElement, opts: DrawablyOptions = {}): Sketch {
  return syncedControl(
    el,
    "checkbox",
    [
      { className: "drawably-outline", gen: outlineRect(5) },
      {
        className: "drawably-check",
        pathLength: true,
        gen: (w, h, o) => roughCheckmark(w * 0.24, h * 0.2, w * 0.52, h * 0.5, o),
      },
      { className: "drawably-focus", gen: focusRect(7) },
    ],
    opts,
    "drawably-checkbox",
  );
}

export function drawablyRadio(el: HTMLElement, opts: DrawablyOptions = {}): Sketch {
  return syncedControl(
    el,
    "radio",
    [
      {
        className: "drawably-outline",
        gen: (w, h, o) => roughCircle(w / 2, h / 2, Math.min(w, h) / 2 - INSET, o),
      },
      {
        className: "drawably-dot",
        gen: (w, h, o) => roughCircle(w / 2, h / 2, Math.min(w, h) * 0.18, o),
      },
      {
        className: "drawably-focus",
        gen: (w, h, o) => roughCircle(w / 2, h / 2, Math.min(w, h) / 2 + 1, o),
      },
    ],
    opts,
    "drawably-radio",
  );
}

export function drawablyToggle(el: HTMLElement, opts: DrawablyOptions = {}): Sketch {
  return syncedControl(
    el,
    "checkbox",
    [
      { className: "drawably-outline", gen: (w, h, o) => outlineRect((h - 2 * INSET) / 2)(w, h, o) },
      {
        className: "drawably-blob drawably-knob",
        gen: (w, h, o) => roughCircle(h / 2, h / 2, h / 2 - INSET - 3, o),
      },
      { className: "drawably-focus", gen: focusRect(12) },
    ],
    opts,
    "drawably-toggle",
  );
}

export function drawablyDivider(el: HTMLElement, opts: DrawablyOptions = {}): Sketch {
  const sketch = attachChrome(
    el,
    [{ className: "drawably-outline", gen: (w, h, o) => roughLine(INSET, h / 2, w - INSET, h / 2, o) }],
    opts,
    false,
  );
  el.classList.add("drawably-divider");
  return sketch;
}

export function drawablyInput(el: HTMLElement, opts: DrawablyOptions = {}): Sketch {
  if (!el?.querySelector?.("input")) throw new Error("drawably: input wrapper needs an <input>");
  const sketch = attachChrome(
    el,
    [
      { className: "drawably-outline", gen: outlineRect(6) },
      { className: "drawably-focus", gen: focusRect(8) },
    ],
    opts,
    false,
  );
  el.classList.add("drawably-inputbox");
  return sketch;
}
