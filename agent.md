# scrawl

Zero-dependency hand-drawn UI. Real HTML controls with SVG chrome. A unique seeded sketch per mount. Strokes boil in CSS.

Install Inter yourself if you want the intended type. The library does not ship font files.

```
npm i scrawl
```

## Vanilla

```js
import { scrawlButton, scrawlCheckbox, scrawlInput, scrawlCard } from "scrawl";
import "scrawl/style.css";

scrawlButton(document.querySelector("#done"), { variant: "solid" });
scrawlCheckbox(document.querySelector("#check")); // wrapper must contain <input type="checkbox">
scrawlInput(document.querySelector("#name")); // wrapper must contain <input>
scrawlCard(document.querySelector("#card"));
```

Each attacher throws if the element is missing. Checkbox/input throw if the inner `<input>` is missing. Returns a sketch: `{ resketch(seed?), destroy() }`. Buttons also have `setState(state)`.

## React

Optional peer. Subpath `"scrawl/react"`. Client-only (uses `useEffect`).

```jsx
import { ScrawlButton, ScrawlCheckbox, ScrawlInput, ScrawlCard } from "scrawl/react";
import "scrawl/style.css";

<ScrawlButton variant="solid" state="idle" onClick={submit}>Done</ScrawlButton>
<ScrawlCheckbox defaultChecked />
<ScrawlInput placeholder="your name" />
<ScrawlCard>…</ScrawlCard>
```

Native element props pass through. Sketch options are top-level props: `seed`, `roughness`, `boil`, `stroke`, `fill`, `paper`, `width`, plus button `variant` and `state`.

## Button

`scrawlButton(el, opts)` → `ButtonSketch`

- `variant`: `"outline"` (default) | `"solid"` | `"scribble"`
- `state`: `"idle"` | `"loading"` | `"error"` | `"success"`
- `setState(state)` after mount. React: `state` prop.
- loading: dimmed, faster boil, `cursor: progress`
- error: `--scrawl-error` (default `#d12724`)
- success: `--scrawl-success` (default `#188a42`)

## Options (all controls)

| option                          | default  | meaning                                                                     |
| ------------------------------- | -------- | --------------------------------------------------------------------------- |
| `seed`                          | random   | omit for a unique sketch per mount                                          |
| `roughness`                     | `1`      | wobble of the base sketch                                                   |
| `boil`                          | `0.3`    | frame-to-frame flicker in px; `0` = one static path                         |
| `stroke` `fill` `paper` `width` | CSS vars | also `--scrawl-stroke`, `--scrawl-fill`, `--scrawl-paper`, `--scrawl-width` |

## Rules

- Do not fake the look with CSS borders. Attach to a real `button`, checkbox wrapper, input wrapper, or `div`.
- Import `scrawl/style.css` once. Do not restyle the SVG paths; theme with the custom properties.
- Respect `prefers-reduced-motion`: the library already freezes boil and skips hover re-sketch. Do not add extra motion on top when that media query matches.
- Hover/press re-sketches buttons and checkboxes only.
- Renderer exports if you need custom shapes: `roughRoundedRect`, `roughLine`, `roughCheckmark`, `scribbleFill`, `variants`, `mulberry32`, `randomSeed`.
- No Vue/Svelte adapters. Vanilla or React.

MIT.
