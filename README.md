# drawably

Hand-drawn UI controls. Every mount generates a fresh pen sketch from seeded
randomness, and the stroke boils like an animated doodle. Zero dependencies,
~12 KB of compiled core modules gzipped (React wrappers add ~1.3 KB) and a
~3.3 KB gzipped stylesheet. An
optional pen font is a separate 31 KB.

![Buttons, checkbox, radio and toggle drawn in a boiling pen stroke](assets/demo.svg)

## Install

```sh
npm i drawably
```

## Quick start

```js
import { drawablyButton } from "drawably";
import "drawably/style.css";

drawablyButton(document.querySelector("#done"), { variant: "solid" });
```

React:

```jsx
import { DrawablyButton } from "drawably/react";
import "drawably/style.css";

<DrawablyButton variant="solid" onClick={submit}>Done</DrawablyButton>
```

Each attach call returns a sketch handle:

```js
const sketch = drawablyButton(el);
sketch.resketch();     // redraw with a new random seed
sketch.resketch(42);   // redraw with a specific seed
sketch.destroy();      // remove the SVG and all listeners
```

## Buttons

Three variants: `outline` (default), `solid`, `scribble`. Buttons also carry a
state machine for async work:

![The four button states: idle, loading, error, success](assets/states.svg)

```js
const button = drawablyButton(el);
button.setState("loading");  // dims the button, boils faster
button.setState("error");    // redraws in red
button.setState("success");  // redraws in green
button.setState("idle");
```

In React, pass the `state` prop; the sketch stays put and only the state
changes:

```jsx
<DrawablyButton state={saving ? "loading" : "idle"}>Save</DrawablyButton>
```

Override the state colours with `--drawably-error` and `--drawably-success`.
For secondary or destructive actions, set `tone: "neutral"` (warm grey) or
`tone: "danger"` (red).

## Controls

| Function | Element it expects |
| --- | --- |
| `drawablyButton(el, opts)` | a `<button>` |
| `drawablyCheckbox(el, opts)` | wrapper containing `<input type="checkbox">` |
| `drawablyRadio(el, opts)` | wrapper containing `<input type="radio">` |
| `drawablyToggle(el, opts)` | wrapper containing `<input type="checkbox">` |
| `drawablyInput(el, opts)` | wrapper containing an `<input>` |
| `drawablyTextarea(el, opts)` | wrapper containing a `<textarea>` |
| `drawablySelect(el, opts)` | wrapper containing a `<select>` |
| `drawablyDivider(el, opts)` | an `<hr>` or div |
| `drawablyCard(el, opts)` | any block element |
| `drawablyBadge(el, opts)` | any inline element |
| `drawablyList(el, opts)` | a `<ul>` or `<ol>`; each `<li>` gets a sketched marker |

Badges take `variant: "outline" | "scribble"`; lists take
`marker: "dash" | "check"`. Selects reserve the widest option's width so
picking never shifts layout; in Chromium the options list gets a sketched
frame and pen check (`appearance: base-select`), Safari and Firefox keep the
OS popup.

The real inputs stay in the DOM, so keyboard, forms, labels and screen readers
all work as usual. The sketch is an `aria-hidden` SVG layered underneath.

Every control has a React counterpart in `drawably/react`: `DrawablyButton`,
`DrawablyCheckbox`, `DrawablyRadio`, `DrawablyToggle`, `DrawablyInput`,
`DrawablyTextarea`, `DrawablySelect`, `DrawablyDivider`, `DrawablyCard`,
`DrawablyBadge`, `DrawablyList`.

## Pie chart

`drawablyPieChart(el, opts)` appends a responsive, scribble-filled pie chart and
an HTML legend to a block element. The host controls its width; the plot
reserves a square before drawing. The SVG is decorative and the HTML legend
exposes every label and percentage to screen readers, including zero values.

```js
import { drawablyPieChart } from "drawably";
import "drawably/style.css";

const data = [
  { label: "Overexcitement and frustration", value: 60 },
  { label: "Learned habit", value: 40 },
  { label: "Fear", value: 0 },
  { label: "Aggression", value: 0 },
];
const chart = drawablyPieChart(document.querySelector("#reasons"), {
  data, seed: 42, roughness: 1, boil: 0, showLegend: true,
});
chart.setData(data); // update values without changing the sketch seed
chart.resketch(7);
chart.destroy(); // removes only the chart's own content and observers
```

React uses the same options and updates when `data` changes:

```jsx
import { DrawablyPieChart } from "drawably/react";

<DrawablyPieChart data={data} seed={42} boil={0} showLegend aria-label="Reasons" />
```

- `data` is required: an array of `{ label, value, color? }`. Values are finite,
  non-negative weights, normalized to percentages; they need not total 100.
  Negative/non-finite values throw before modifying the chart.
- `showLegend` defaults to `true`. When false, the legend remains available to
  screen readers. Small slices omit interior labels to avoid collisions.
- Zero values have legend entries but no slices. Empty/all-zero data displays
  “No data”; a single positive value draws a full circle.
- Per-item `color` accepts a CSS colour or `var(...)`. Alternatively, set
  `--drawably-series-1` through `--drawably-series-6` on the host or an ancestor.
  Colours cycle after six items; labels always identify the categories.
- The standard `seed`, `roughness`, `boil`, `stroke`, `paper`, and `width` options
  apply. `width` is pen-stroke thickness, not chart width. `boil: 0` is static;
  reduced-motion preferences freeze the existing CSS animation automatically.
- Percentages are rounded to one decimal; tiny positive shares display
  `<0.1%`. Rounded percentages may not add to exactly 100.

See [the pie chart example](examples/pie-chart.html). The optional
`drawably/font.css` registers Drawably Pen; the chart inherits the host font.

## Text decoration

Annotate copy the way you would with a pen. Each attaches to an inline element
and leaves its layout alone; use them on a word or a short phrase.

| Function | Draws |
| --- | --- |
| `drawablyUnderline(el, opts)` | a rough line under the text, re-sketched on hover |
| `drawablyHighlight(el, opts)` | a marker wash behind the text |
| `drawablyCircle(el, opts)` | a hand-drawn ellipse looping around the text |
| `drawablyArrow(from, to, opts)` | an arrow from one element to another |

```jsx
import { DrawablyUnderline, DrawablyHighlight, DrawablyCircle, DrawablyArrow } from "drawably/react";

<p>
  <DrawablyUnderline>Hand-drawn</DrawablyUnderline> UI, a{" "}
  <DrawablyHighlight>fresh sketch</DrawablyHighlight> on{" "}
  <DrawablyCircle>every mount</DrawablyCircle>.
</p>
<DrawablyArrow from={noteRef} to={buttonRef} />
```

A decoration that wraps onto several lines gets one drawing per line. The
arrow's SVG is appended to `<body>` in document coordinates and redraws on
resize. Anchors inside a scrolling container will drift as it scrolls.

## Composites

Pieces built from the controls above. One `seed` reproduces every stroke in
the piece; `destroy()` tears them all down.

| Function | Markup | Draws |
| --- | --- | --- |
| `drawablyChip(el, opts)` | `<label><span><input type="checkbox"></span> text</label>` | badge around the chip, sketched box on the input's wrapper |
| `drawablyTabs(el, opts)` | children are the tabs | underline on the active tab; `active` index or `aria-selected="true"`; `setActive(i)` |
| `drawablyTooltip(tip, target, opts)` | two elements | card around the tip, arrow to the target |
| `drawablyAlert(el, opts)` | optional `[data-tag]` child | card around the alert, badge on the tag |
| `drawablySteps(el, opts)` | `<ol>` | check-marked list |
| `drawablyKbd(el, opts)` | `<kbd>` | badge with a steadier hand |
| `drawablyQuote(el, opts)` | first element child, optional `<footer>` | highlight on the line, divider on the footer |
| `drawablyPager(el, opts)` | child `<button>`s | outlined pages, solid current; `active` index or `aria-current`; `setPage(i)` |

```jsx
import { DrawablyChip, DrawablyTabs, DrawablyTooltip, DrawablyAlert, DrawablySteps, DrawablyKbd, DrawablyQuote, DrawablyPager } from "drawably/react";

<DrawablyChip defaultChecked>pen</DrawablyChip>
<DrawablyTabs active={tab}><span>a</span><span>b</span></DrawablyTabs>
<DrawablyTooltip to={buttonRef}>undo</DrawablyTooltip>
<DrawablyAlert><span data-tag>new</span> Import from Attio lands Friday</DrawablyAlert>
<DrawablySteps><li>record</li><li>label</li></DrawablySteps>
<DrawablyKbd>⌘K</DrawablyKbd>
<DrawablyQuote><span>less, but better</span><footer>Rams</footer></DrawablyQuote>
<DrawablyPager active={page}><button>‹</button><button>1</button><button>›</button></DrawablyPager>
```

## Options

All controls take the same base options:

| Option | Default | What it does |
| --- | --- | --- |
| `seed` | random | Omit for a unique sketch per mount, pass a number for a reproducible one |
| `roughness` | `1` | Wobble of the base sketch |
| `boil` | `0.3` | Px of frame-to-frame flicker; `0` renders one static path |
| `stroke`, `fill`, `paper` | pen blue / white | Colours, set as `--drawably-*` custom properties |
| `width` | `2` | Stroke width in px |

The colours are plain CSS custom properties, so a theme can set them once:

```css
:root {
  --drawably-stroke: #1a1a1a;
  --drawably-fill: #1a1a1a;
}
```

Type is Inter when the page has it loaded, falling back to `system-ui`. The
library loads no font unless you opt into the one below.

## Motion

Strokes boil gently: three frames of the same sketch, micro-wobbled around a
shared base, cycled by pure CSS at 1200ms. Hover or press re-sketches
buttons, checkboxes, radios, toggles, underlines and circles; buttons also lift
on hover and sink on press. `prefers-reduced-motion` freezes everything to a
single static sketch, including the demo images above.

## Font (optional)

Drawably Pen is the same strokes as a typeface: a–z, A–Z, digits and
punctuation, built by the library's own pen code (`font/`) into a 31 KB
TrueType. It is not loaded by `style.css`; nothing in the library needs it.
If you want labels in the same hand as the chrome:

```ts
import "drawably/font.css";
```

```css
.drawably-button {
  font-family: "Drawably Pen", Inter, sans-serif;
}
```

## Build your own shapes

The rough renderer is exported. Each function returns an SVG path string, and
`variants` produces the boil frames:

```js
import { roughRoundedRect, roughLine, roughCircle, variants } from "drawably";

const frames = variants(
  (o) => roughRoundedRect(0, 0, 200, 100, 12, o),
  { seed: 7, roughness: 1, boil: 0.3 },
);
// three path strings — render them and cycle opacity
```

Also exported: `roughEllipse`, `roughArrow`, `roughCheckmark`, `roughPieSlice`, `scribbleFill`,
and the seeded PRNG `mulberry32` with `randomSeed`.

## License

MIT.
