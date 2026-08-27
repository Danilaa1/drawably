# drawably

Zero-dependency hand-drawn UI. Real HTML controls with SVG chrome. A unique seeded sketch per mount. Strokes boil in CSS.

Install Inter yourself if you want the intended type. The library does not ship font files.

```
npm i drawably
```

## Vanilla

```js
import {
  drawablyButton,
  drawablyCheckbox,
  drawablyRadio,
  drawablyToggle,
  drawablyInput,
  drawablyDivider,
  drawablyCard,
  drawablyUnderline,
  drawablyHighlight,
  drawablyCircle,
  drawablyArrow,
} from "drawably";
import "drawably/style.css";

drawablyButton(document.querySelector("#done"), { variant: "solid" });
drawablyCheckbox(document.querySelector("#check")); // wrapper must contain <input type="checkbox">
drawablyRadio(document.querySelector("#pen")); // wrapper must contain <input type="radio">
drawablyToggle(document.querySelector("#tog")); // wrapper must contain <input type="checkbox">
drawablyInput(document.querySelector("#name")); // wrapper must contain <input>
drawablyDivider(document.querySelector("#rule")); // <hr> or div
drawablyCard(document.querySelector("#card"));
drawablyUnderline(document.querySelector("#word")); // any inline element
drawablyHighlight(document.querySelector("#word"));
drawablyCircle(document.querySelector("#price"));
drawablyArrow(document.querySelector("#from"), document.querySelector("#to")); // two anchors
```

Each attacher throws if the element is missing. Checkbox/radio/toggle/input throw if the inner `<input>` is missing. Arrow throws if either anchor is missing. Returns a sketch: `{ resketch(seed?), destroy() }`. Buttons also have `setState(state)`.

## React

Optional peer. Subpath `"drawably/react"`. Client-only (uses `useEffect`).

```jsx
import {
  DrawablyButton,
  DrawablyCheckbox,
  DrawablyRadio,
  DrawablyToggle,
  DrawablyInput,
  DrawablyDivider,
  DrawablyCard,
  DrawablyUnderline,
  DrawablyHighlight,
  DrawablyCircle,
  DrawablyArrow,
} from "drawably/react";
import "drawably/style.css";

<DrawablyButton variant="solid" state="idle" onClick={submit}>Done</DrawablyButton>
<DrawablyButton tone="neutral">Cancel</DrawablyButton>
<DrawablyButton tone="danger">Delete</DrawablyButton>
<DrawablyCheckbox defaultChecked />
<DrawablyRadio name="ink" defaultChecked />
<DrawablyToggle />
<DrawablyInput placeholder="your name" />
<DrawablyDivider />
<DrawablyCard>…</DrawablyCard>
<DrawablyUnderline>hand-drawn</DrawablyUnderline>
<DrawablyHighlight>fresh sketch</DrawablyHighlight>
<DrawablyCircle>$0</DrawablyCircle>
<DrawablyArrow from={fromRef} to={toRef} />
```

Native element props pass through. Sketch options are top-level props: `seed`, `roughness`, `boil`, `stroke`, `fill`, `paper`, `width`, plus button `variant`, `state`, and `tone`. `DrawablyArrow` takes two refs and renders nothing.

## Button

`drawablyButton(el, opts)` → `ButtonSketch`

- `variant`: `"outline"` (default) | `"solid"` | `"scribble"`
- `state`: `"idle"` | `"loading"` | `"error"` | `"success"`
- `tone`: `"neutral"` (warm grey, secondary) | `"danger"` (red)
- `setState(state)` after mount. React: `state` prop.
- loading: dimmed, faster boil, `cursor: progress`
- error: `--drawably-error` (default `#d12724`)
- success: `--drawably-success` (default `#188a42`)

## Other controls

- `drawablyCheckbox(wrap, opts)` — checkbox in a wrapper
- `drawablyRadio(wrap, opts)` — radio in a wrapper; scribbled dot when checked. Same `name` groups them.
- `drawablyToggle(wrap, opts)` — checkbox in a wrapper; pill with a sliding ink-blob knob. React sets `role="switch"`.
- `drawablyInput(wrap, opts)` — text input in a wrapper
- `drawablyDivider(el, opts)` — rough line on an `<hr>` or div
- `drawablyCard(el, opts)` — sketched container

## Text decoration

Decorates existing inline text; the element keeps its own layout. Use on a word or short phrase — a phrase that wraps gets one box, not one per line.

- `drawablyUnderline(el, opts)` — rough line under the text; hover re-sketches
- `drawablyHighlight(el, opts)` — marker wash behind the text, `--drawably-fill` at 30%
- `drawablyCircle(el, opts)` — hand-drawn ellipse looping around the text; hover re-sketches
- `drawablyArrow(from, to, opts)` — annotation arrow from one element to another. The SVG is appended to `<body>` in document coordinates and follows resize; anchors inside a scrolling container drift on scroll.

## Options (all controls)

| option                          | default  | meaning                                                                     |
| ------------------------------- | -------- | --------------------------------------------------------------------------- |
| `seed`                          | random   | omit for a unique sketch per mount                                          |
| `roughness`                     | `1`      | wobble of the base sketch                                                   |
| `boil`                          | `0.3`    | frame-to-frame flicker in px; `0` = one static path                         |
| `stroke` `fill` `paper` `width` | CSS vars | also `--drawably-stroke`, `--drawably-fill`, `--drawably-paper`, `--drawably-width` |

## Rules

- Do not fake the look with CSS borders. Attach to a real `button`, checkbox/radio wrapper, input wrapper, `hr`, `div`, or inline text element.
- Import `drawably/style.css` once. Do not restyle the SVG paths; theme with the custom properties.
- Respect `prefers-reduced-motion`: the library already freezes boil and skips hover re-sketch. Do not add extra motion on top when that media query matches.
- Hover/press re-sketches buttons, checkboxes, radios, toggles, underlines and circles.
- Renderer exports if you need custom shapes: `roughRoundedRect`, `roughCircle`, `roughEllipse`, `roughLine`, `roughArrow`, `roughCheckmark`, `scribbleFill`, `variants`, `mulberry32`, `randomSeed`.
- No Vue/Svelte adapters. Vanilla or React.

MIT.
