# scrawl

Hand-drawn UI controls. Every mount generates a fresh pen sketch from seeded
randomness; the stroke boils like an animated doodle. Zero dependencies.

## Use

    npm i scrawl

    import { scrawlButton } from "scrawl";
    import "scrawl/style.css";

    scrawlButton(document.querySelector("#done"), { variant: "solid" });

React:

    import { ScrawlButton } from "scrawl/react";

    <ScrawlButton variant="solid" onClick={submit}>Done</ScrawlButton>

## Controls

- `scrawlButton(el, opts)` — variants: `outline` (default), `solid`, `scribble`
- `scrawlCheckbox(wrapper, opts)` — wrapper contains an `<input type="checkbox">`
- `scrawlInput(wrapper, opts)` — wrapper contains an `<input>`
- `scrawlCard(el, opts)`

Options:

- `seed` — omit for a unique sketch per mount, pass for a reproducible one
- `roughness` — wobble of the base sketch, default `1`
- `boil` — px of frame-to-frame flicker, default `0.5`; `0` renders one
  static path
- `stroke`, `fill`, `paper`, `width` — set the matching `--scrawl-*` custom
  property; equally settable in plain CSS

## Motion

Strokes boil gently: three frames of the same sketch, micro-wobbled around a
shared base, cycled by pure CSS at 900ms. Hover or press re-sketches buttons
and checkboxes. `prefers-reduced-motion` freezes everything to a static
sketch.

The rough renderer (`roughRoundedRect`, `roughLine`, `roughCheckmark`,
`scribbleFill`) is exported — build your own shapes on it.

MIT.
