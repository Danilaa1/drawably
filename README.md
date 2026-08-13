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

- `scrawlButton(el, opts)` — variants: `outline` (default), `solid`, `scribble`.
  Returns a sketch with `setState("idle" | "loading" | "error" | "success")`:
  loading dims the button and boils faster, error redraws in red, success in
  green. Initial state via `opts.state`; in React, the `state` prop. Override
  the colours with `--scrawl-error` / `--scrawl-success`.
  Tone via `opts.tone`: `neutral` (warm grey, for cancel/secondary actions) or
  `danger` (red).
- `scrawlCheckbox(wrapper, opts)` — wrapper contains an `<input type="checkbox">`
- `scrawlRadio(wrapper, opts)` — wrapper contains an `<input type="radio">`;
  hand-drawn circle with a scribbled dot
- `scrawlToggle(wrapper, opts)` — wrapper contains an `<input type="checkbox">`;
  sketched pill with an ink-blob knob that slides on flip
- `scrawlInput(wrapper, opts)` — wrapper contains an `<input>`
- `scrawlDivider(el, opts)` — a rough line across an `<hr>` or div
- `scrawlCard(el, opts)`

Options:

- `seed` — omit for a unique sketch per mount, pass for a reproducible one
- `roughness` — wobble of the base sketch, default `1`
- `boil` — px of frame-to-frame flicker, default `0.3`; `0` renders one
  static path
- `stroke`, `fill`, `paper`, `width` — set the matching `--scrawl-*` custom
  property; equally settable in plain CSS

Type is set in Inter when the page has it loaded (the library ships no font
files — load Inter yourself), falling back to `system-ui`.

## Motion

Strokes boil gently: three frames of the same sketch, micro-wobbled around a
shared base, cycled by pure CSS at 1200ms. Hover or press re-sketches buttons
and checkboxes. `prefers-reduced-motion` freezes everything to a static
sketch.

The rough renderer (`roughRoundedRect`, `roughLine`, `roughCheckmark`,
`scribbleFill`) is exported — build your own shapes on it.

MIT.
