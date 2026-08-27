# drawably

Zero-dependency hand-drawn UI. Real HTML controls with SVG chrome. A unique seeded sketch per mount. Strokes boil in CSS.

Install Inter yourself if you want the intended type. The library loads no font unless you import the optional `drawably/font.css`.

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
  drawablyTextarea,
  drawablySelect,
  drawablyDivider,
  drawablyCard,
  drawablyBadge,
  drawablyList,
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
drawablyTextarea(document.querySelector("#msg")); // wrapper must contain <textarea>
drawablySelect(document.querySelector("#pick")); // wrapper must contain <select>; reserves the widest option's width so picking never shifts layout
drawablyDivider(document.querySelector("#rule")); // <hr> or div
drawablyCard(document.querySelector("#card"));
drawablyBadge(document.querySelector("#tag"), { variant: "scribble" });
drawablyList(document.querySelector("#features"), { marker: "check" }); // <ul> or <ol>
drawablyUnderline(document.querySelector("#word")); // any inline element
drawablyHighlight(document.querySelector("#word"));
drawablyCircle(document.querySelector("#price"));
drawablyArrow(document.querySelector("#from"), document.querySelector("#to")); // two anchors
```

Each attacher throws if the element is missing. Checkbox/radio/toggle/input/textarea/select throw if the inner field is missing. Arrow throws if either anchor is missing. Returns a sketch: `{ resketch(seed?), destroy() }`. Buttons also have `setState(state)`.

## React

Optional peer. Subpath `"drawably/react"`. Client-only (uses `useEffect`).

```jsx
import {
  DrawablyButton,
  DrawablyCheckbox,
  DrawablyRadio,
  DrawablyToggle,
  DrawablyInput,
  DrawablyTextarea,
  DrawablySelect,
  DrawablyDivider,
  DrawablyCard,
  DrawablyBadge,
  DrawablyList,
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
<DrawablyTextarea rows={4} />
<DrawablySelect><option>Pen</option><option>Pencil</option></DrawablySelect>
<DrawablyDivider />
<DrawablyCard>…</DrawablyCard>
<DrawablyBadge variant="scribble">new</DrawablyBadge>
<DrawablyList marker="check"><li>…</li></DrawablyList>
<DrawablyUnderline>hand-drawn</DrawablyUnderline>
<DrawablyHighlight>fresh sketch</DrawablyHighlight>
<DrawablyCircle>$0</DrawablyCircle>
<DrawablyArrow from={fromRef} to={toRef} />
```

Native element props pass through. Sketch options are top-level props: `seed`, `roughness`, `boil`, `stroke`, `fill`, `paper`, `width`, plus button `variant`, `state`, and `tone`, badge `variant`, list `marker`. `DrawablyArrow` takes two refs and renders nothing. `DrawablyList` renders a `<ul>`.

## Button

`drawablyButton(el, opts)` → `ButtonSketch`

- `variant`: `"outline"` (default) | `"solid"` | `"scribble"`
- `state`: `"idle"` | `"loading"` | `"error"` | `"success"`
- `tone`: `"neutral"` (warm grey, secondary) | `"danger"` (red)
- `setState(state)` after mount. React: `state` prop.
- hover: lifts 1px and washes the inside with the stroke at 10% (outline/scribble); press: sinks and the outline thickens. Native `disabled` dims it and drops both.
- loading: dimmed, faster boil, `cursor: progress`
- error: `--drawably-error` (default `#d12724`)
- success: `--drawably-success` (default `#188a42`)

## Other controls

- `drawablyCheckbox(wrap, opts)` — checkbox in a wrapper
- `drawablyRadio(wrap, opts)` — radio in a wrapper; scribbled dot when checked. Same `name` groups them.
- `drawablyToggle(wrap, opts)` — checkbox in a wrapper; pill with a sliding ink-blob knob. React sets `role="switch"`.
- `drawablyInput(wrap, opts)` — text input in a wrapper
- `drawablyTextarea(wrap, opts)` — textarea in a wrapper; vertical resize redraws the sketch
- `drawablySelect(wrap, opts)` — select in a wrapper; native arrow hidden, sketched chevron in its place. Width is reserved for the widest option at attach, so changing the value never shifts layout (re-attach if options change). In Chromium the options popup gets a sketched frame too; other browsers show the OS popup.
- `drawablyDivider(el, opts)` — rough line on an `<hr>` or div
- `drawablyCard(el, opts)` — sketched container
- `drawablyBadge(el, opts)` — tight sharp-cornered tag on an inline element; `variant`: `"outline"` (default) | `"scribble"`
- `drawablyList(el, opts)` — `<ul>` or `<ol>`; native markers hidden, one sketched marker per `<li>`. `marker`: `"dash"` (default) | `"check"`. Only the `<li>` present at attach time are sketched; an `<ol>` loses its numbers.

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

## Font (optional)

`import "drawably/font.css"` registers "Drawably Pen", the library's strokes as a 31 KB TrueType (a–z, A–Z, digits, punctuation). Apply it yourself with `font-family: "Drawably Pen", Inter, sans-serif`. Nothing loads it by default.

## Rules

- Do not fake the look with CSS borders. Attach to a real `button`, checkbox/radio wrapper, input/textarea/select wrapper, `hr`, `div`, `ul`, or inline text element.
- Import `drawably/style.css` once. Do not restyle the SVG paths; theme with the custom properties.
- Respect `prefers-reduced-motion`: the library already freezes boil and skips hover re-sketch. Do not add extra motion on top when that media query matches.
- Hover/press re-sketches buttons, checkboxes, radios, toggles, underlines and circles. A decoration that wraps gets one drawing per line.
- Select: in Chromium the options list gets a sketched frame and pen checkmark (`appearance: base-select`); Safari and Firefox keep the OS popup. Options are measured once at attach — re-attach if they change.
- Renderer exports if you need custom shapes: `roughRoundedRect`, `roughCircle`, `roughEllipse`, `roughLine`, `roughArrow`, `roughCheckmark`, `scribbleFill`, `variants`, `mulberry32`, `randomSeed`.
- Do not apply Drawably Pen unless the user asks for the font; controls default to the page's own type.
- No Vue/Svelte adapters. Vanilla or React.

MIT.
