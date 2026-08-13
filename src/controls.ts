import { randomSeed } from "./prng.js";
import {
  type RoughOptions,
  roughCheckmark,
  roughRoundedRect,
  scribbleFill,
  variants,
} from "./rough.js";

export interface ScrawlOptions {
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
  opts: ScrawlOptions,
  interactive: boolean,
): Sketch {
  if (!(el instanceof HTMLElement)) throw new Error("scrawl: expected an HTMLElement");
  el.classList.add("scrawl-host");
  if (opts.stroke) el.style.setProperty("--scrawl-stroke", opts.stroke);
  if (opts.fill) el.style.setProperty("--scrawl-fill", opts.fill);
  if (opts.paper) el.style.setProperty("--scrawl-paper", opts.paper);
  if (opts.width !== undefined) el.style.setProperty("--scrawl-width", String(opts.width));

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "scrawl-svg");
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
        p.setAttribute("class", ds.length > 1 ? `scrawl-boil ${layer.className}` : layer.className);
        p.dataset.i = String(i);
        p.style.setProperty("--boil-i", String(i));
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
      el.classList.remove("scrawl-host");
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

export type ScrawlButtonState = "idle" | "loading" | "error" | "success";

export interface ScrawlButtonOptions extends ScrawlOptions {
  variant?: "outline" | "solid" | "scribble";
  state?: ScrawlButtonState;
}

export interface ButtonSketch extends Sketch {
  setState(state: ScrawlButtonState): void;
}

export function scrawlButton(el: HTMLElement, opts: ScrawlButtonOptions = {}): ButtonSketch {
  const variant = opts.variant ?? "outline";
  const layers: Layer[] = [];
  if (variant === "solid") layers.push({ className: "scrawl-blob", gen: outlineRect(8) });
  if (variant === "scribble")
    layers.push({
      className: "scrawl-scribble",
      gen: (w, h, o) => scribbleFill(INSET + 2, INSET + 2, w - 2 * INSET - 4, h - 2 * INSET - 4, o),
    });
  layers.push({ className: "scrawl-outline", gen: outlineRect(8) });
  layers.push({ className: "scrawl-focus", gen: focusRect(10) });
  const sketch = attachChrome(el, layers, opts, true);
  el.classList.add("scrawl-button", `scrawl-button--${variant}`);
  const setState = (state: ScrawlButtonState) => {
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

export function scrawlCard(el: HTMLElement, opts: ScrawlOptions = {}): Sketch {
  const sketch = attachChrome(el, [{ className: "scrawl-outline", gen: outlineRect(10) }], opts, false);
  el.classList.add("scrawl-card");
  return sketch;
}

export function scrawlCheckbox(el: HTMLElement, opts: ScrawlOptions = {}): Sketch {
  const input = el.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!input) throw new Error("scrawl: checkbox wrapper needs an <input type=\"checkbox\">");
  const sync = () => {
    if (input.checked) el.dataset.checked = "";
    else delete el.dataset.checked;
  };
  sync();
  input.addEventListener("change", sync);
  const sketch = attachChrome(
    el,
    [
      { className: "scrawl-outline", gen: outlineRect(5) },
      {
        className: "scrawl-check",
        pathLength: true,
        gen: (w, h, o) => roughCheckmark(w * 0.24, h * 0.2, w * 0.52, h * 0.5, o),
      },
      { className: "scrawl-focus", gen: focusRect(7) },
    ],
    opts,
    true,
  );
  el.classList.add("scrawl-checkbox");
  return {
    resketch: sketch.resketch,
    destroy() {
      input.removeEventListener("change", sync);
      sketch.destroy();
      el.classList.remove("scrawl-checkbox");
      delete el.dataset.checked;
    },
  };
}

export function scrawlInput(el: HTMLElement, opts: ScrawlOptions = {}): Sketch {
  if (!el?.querySelector?.("input")) throw new Error("scrawl: input wrapper needs an <input>");
  const sketch = attachChrome(
    el,
    [
      { className: "scrawl-outline", gen: outlineRect(6) },
      { className: "scrawl-focus", gen: focusRect(8) },
    ],
    opts,
    false,
  );
  el.classList.add("scrawl-inputbox");
  return sketch;
}
