# drawably 1.0 — roadmap

Goal: enough components to build a complete landing page in drawably alone.
Ship in stages; each stage is releasable on its own. Every component follows
the contract in `CLAUDE.md` (attacher + handle, React wrapper, tests, docs,
example — that list is the per-component definition of done and is not
repeated below).

Current set (0.3.x): button, checkbox, radio, toggle, input, textarea, select,
divider, card, badge, list, underline, highlight, circle, arrow. Plus Drawably
Pen, an opt-in font built in-repo from the same strokes (0.3.10).

## Stage 1 — text decoration

The stage that changes what the library is: from sketchy form controls to a
landing-page language. Everything here decorates existing text rather than
wrapping a control.

| Component | Element | Sketch | Needs |
| --- | --- | --- | --- |
| `drawablyUnderline(el)` | any inline element | rough line under the text, re-sketch on hover | `roughLine` (have) |
| `drawablyHighlight(el)` | any inline element | marker wash behind the text: low-opacity `scribbleFill` | have |
| `drawablyCircle(el)` | any inline element | hand-drawn ellipse around a word or price | **new: `roughEllipse`** |
| `drawablyArrow(from, to)` | two elements | sketched arrow between them, annotation-style | **new: `roughArrow`** (line + open head) |

Notes:
- Inline decoration needs the SVG sized to the text box, overflow visible,
  and re-measure on resize (`ResizeObserver`, disconnect in `destroy`).
- `drawablyArrow` is the odd one out: two anchors, positioned in the nearest
  common ancestor. Decide overlay strategy before building it; it may slip to
  its own release if the anchoring gets hairy.
- `roughEllipse` and `roughArrow` are the only additions to `rough.ts` in the
  whole plan.

Shipped as 0.2.0.

## Stage 2 — complete the form set

Signup and contact sections need these; all four are recombinations of
existing generators.

| Component | Element | Sketch |
| --- | --- | --- |
| `drawablyTextarea(wrap)` | wrapper with `<textarea>` | input's rect, taller |
| `drawablySelect(wrap)` | wrapper with `<select>` | rect + sketched chevron (`roughCheckmark` rotated or two `roughLine`s) |
| `drawablyBadge(el)` | small inline element | tight rect, sharp corners, optional `scribbleFill` |
| `drawablyList(el)` | `<ul>` / `<ol>` | rough check or dash marker per `<li>`, native markers hidden |

Shipped as 0.3.0.

## Stage 3 — disclosure

FAQ and feature sections.

| Component | Element | Sketch |
| --- | --- | --- |
| `drawablyAccordion(el)` | native `<details>`/`<summary>` | card rect + chevron that re-sketches between open/closed (icon changes morph via re-sketch, never swap) |
| `drawablyTabs(el)` | tablist markup with buttons | rough underline that re-sketches under the active tab; library adds sketches, consumer wires ARIA |
| frame option on card | existing `drawablyCard` | `padding: 0` use for screenshots/avatars — an option or a docs recipe, **not** a new component |

Release as 0.4.0.

## Stage 4 — 1.0 polish

No new components. Docs site section per component, size re-check against the
README claim, API freeze, then 1.0.0.

## Not building

Modal, toast, table, slider, datepicker, tooltip, Vue/Svelte adapters, icon
set. Not landing-page components; revisit only on real demand. Navbar, footer
and hero are compositions consumers build from the pieces above.
