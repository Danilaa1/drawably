# scrawl

Zero-dependency hand-drawn UI. Real HTML controls with SVG chrome. A unique seeded sketch per mount. Strokes boil in CSS.

Install Inter yourself if you want the intended type. The library does not ship font files.

```
npm i scrawl
```

## Vanilla

```js
import {
  scrawlButton,
  scrawlCheckbox,
  scrawlRadio,
  scrawlToggle,
  scrawlInput,
  scrawlDivider,
  scrawlCard,
} from "scrawl";
import "scrawl/style.css";

scrawlButton(document.querySelector("#done"), { variant: "solid" });
scrawlCheckbox(document.querySelector("#check")); // wrapper must contain <input type="checkbox">
scrawlRadio(document.querySelector("#pen")); // wrapper must contain <input type="radio">
scrawlToggle(document.querySelector("#tog")); // wrapper must contain <input type="checkbox">
scrawlInput(document.querySelector("#name")); // wrapper must contain <input>
scrawlDivider(document.querySelector("#rule")); // <hr> or div
scrawlCard(document.querySelector("#card"));
```

Each attacher throws if the element is missing. Checkbox/radio/toggle/input throw if the inner `<input>` is missing. Returns a sketch: `{ resketch(seed?), destroy() }`. Buttons also have `setState(state)`.

## React

Optional peer. Subpath `"scrawl/react"`. Client-only (uses `useEffect`).

```jsx
import {
  ScrawlButton,
  ScrawlCheckbox,
  ScrawlRadio,
  ScrawlToggle,
  ScrawlInput,
  ScrawlDivider,
  ScrawlCard,
} from "scrawl/react";
import "scrawl/style.css";

<ScrawlButton variant="solid" state="idle" onClick={submit}>Done</ScrawlButton>
<ScrawlButton tone="neutral">Cancel</ScrawlButton>
<ScrawlButton tone="danger">Delete</ScrawlButton>
<ScrawlCheckbox defaultChecked />
<ScrawlRadio name="ink" defaultChecked />
<ScrawlToggle />
<ScrawlInput placeholder="your name" />
<ScrawlDivider />
<ScrawlCard>…</ScrawlCard>
```

Native element props pass through. Sketch options are top-level props: `seed`, `roughness`, `boil`, `stroke`, `fill`, `paper`, `width`, plus button `variant`, `state`, and `tone`.

## Button

`scrawlButton(el, opts)` → `ButtonSketch`

- `variant`: `"outline"` (default) | `"solid"` | `"scribble"`
- `state`: `"idle"` | `"loading"` | `"error"` | `"success"`
- `tone`: `"neutral"` (warm grey, secondary) | `"danger"` (red)
- `setState(state)` after mount. React: `state` prop.
- loading: dimmed, faster boil, `cursor: progress`
- error: `--scrawl-error` (default `#d12724`)
- success: `--scrawl-success` (default `#188a42`)

## Other controls

- `scrawlCheckbox(wrap, opts)` — checkbox in a wrapper
- `scrawlRadio(wrap, opts)` — radio in a wrapper; scribbled dot when checked. Same `name` groups them.
- `scrawlToggle(wrap, opts)` — checkbox in a wrapper; pill with a sliding ink-blob knob. React sets `role="switch"`.
- `scrawlInput(wrap, opts)` — text input in a wrapper
- `scrawlDivider(el, opts)` — rough line on an `<hr>` or div
- `scrawlCard(el, opts)` — sketched container

## Options (all controls)

| option                          | default  | meaning                                                                     |
| ------------------------------- | -------- | --------------------------------------------------------------------------- |
| `seed`                          | random   | omit for a unique sketch per mount                                          |
| `roughness`                     | `1`      | wobble of the base sketch                                                   |
| `boil`                          | `0.3`    | frame-to-frame flicker in px; `0` = one static path                         |
| `stroke` `fill` `paper` `width` | CSS vars | also `--scrawl-stroke`, `--scrawl-fill`, `--scrawl-paper`, `--scrawl-width` |

## Rules

- Do not fake the look with CSS borders. Attach to a real `button`, checkbox/radio wrapper, input wrapper, `hr`, or `div`.
- Import `scrawl/style.css` once. Do not restyle the SVG paths; theme with the custom properties.
- Respect `prefers-reduced-motion`: the library already freezes boil and skips hover re-sketch. Do not add extra motion on top when that media query matches.
- Hover/press re-sketches buttons, checkboxes, radios, and toggles.
- Renderer exports if you need custom shapes: `roughRoundedRect`, `roughCircle`, `roughLine`, `roughCheckmark`, `scribbleFill`, `variants`, `mulberry32`, `randomSeed`.
- No Vue/Svelte adapters. Vanilla or React.

MIT.
