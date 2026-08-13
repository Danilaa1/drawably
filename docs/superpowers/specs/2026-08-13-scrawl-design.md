# scrawl — design

2026-08-13. Tiny zero-dependency UI library: real HTML controls with hand-drawn
SVG chrome, freshly randomised per mount, animated like a living pen sketch.

## Why

Fun open-source project. Every render is a unique sketch; the stroke boils like
an animated doodle. Reference look: wobbly closed strokes, scribble fills, a
filled blob button (blue-pen doodle style).

## Technique

SVG jitter. Sample each shape's ideal geometry into points, displace them with
a seeded PRNG, emit an SVG path with round caps and joins. Double-stroke pass —
two slightly offset strokes per shape — for the pen-going-over-it feel.

Rejected: CSS `border-radius` hack (no boil, no scribble, reads as a CSS trick)
and canvas (raster on retina, DPR juggling, no CSS-driven animation).

## Package

`~/Developer/Animation-library/scrawl/`, own git repo, same shape as slot-text:

- `src/rough.ts` — the renderer. Shape descriptor in (`roundedRect`, `line`,
  `checkmark`, `scribbleFill`), jittered path string out. `mulberry32` PRNG.
- `src/controls.ts` — vanilla attachers: `scrawlButton(el, opts)`,
  `scrawlCheckbox`, `scrawlInput`, `scrawlCard`.
- `src/react.ts` — thin client-only wrappers: `<ScrawlButton>` etc.
- `style.css` — side-effect import, like slot-text.
- `exports` map: `.` and `./react`. vitest. `examples/`.

Zero dependencies. No Vue/Solid/Svelte adapters until someone asks.

## Options

`{ seed?, roughness?, stroke?, fill? }`. `seed` omitted = random per mount
(every page unique); passed = reproducible. `roughness` scales jitter
amplitude. Colours also settable via 4 CSS custom properties — that is the
whole theming system.

## Controls

Real HTML element sizes the layout; SVG chrome is absolutely positioned behind
it, injected on mount. Control reserves its space from the first frame — no
layout shift, no SSR hydration mismatch. ResizeObserver regenerates the sketch
on size change.

- **Button** — outline variant and filled-blob variant (scribble or solid
  blob fill, like the "Done" reference).
- **Checkbox** — wobbly box; check scrawls on via stroke-dashoffset when
  toggled.
- **Input** — real text input with sketched box.
- **Card** — sketched container.

## Motion

- **Boil** — each shape renders 3 pre-jittered path variants stacked in the
  SVG; pure CSS `steps(3)` opacity cycle at ~8fps using negative
  animation-delays. No JS timer, no rAF.
- **Re-sketch on interaction** — pointerenter/pointerdown regenerates all 3
  variants with a new seed. Press pairs with `scale(0.92)`.
- **Checkbox check draw-on** — stroke-dashoffset transition on toggle.
- `prefers-reduced-motion`: boil off (static first variant), re-sketch off,
  check appears without draw-on.

## Errors

Attachers throw on a null element; everything else degrades to a plain
unstyled control (the real HTML element always works).

## Tests

vitest, no DOM screenshot rigging:

- PRNG determinism (same seed → same sequence).
- Path generation snapshot per seed per shape.
- 3 variants emitted per shape; distinct d strings.
- Attacher injects SVG, cleans up on destroy.

## Skipped

Icon set (renderer makes it possible later), theming beyond 4 custom
properties, extra framework adapters, draw-on entrance for whole controls
(boil + interaction cover v1).
