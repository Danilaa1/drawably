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

Options: `seed` (omit for a unique sketch per mount), `roughness`, `stroke`,
`fill`. Theming: `--scrawl-stroke`, `--scrawl-fill`, `--scrawl-paper`,
`--scrawl-width`.

## Motion

Strokes boil at 8fps via a pure-CSS variant cycle. Hover or press re-sketches
buttons and checkboxes. `prefers-reduced-motion` freezes everything to a
static sketch.

The rough renderer (`roughRoundedRect`, `roughLine`, `roughCheckmark`,
`scribbleFill`) is exported — build your own shapes on it.

MIT.
