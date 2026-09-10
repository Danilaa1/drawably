import {
  type ComponentProps,
  createElement,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from "react";
import {
  type ButtonSketch,
  type DrawablyBadgeOptions,
  type DrawablyButtonOptions,
  type DrawablyListOptions,
  type DrawablyOptions,
  drawablyArrow,
  drawablyBadge,
  drawablyButton,
  drawablyCard,
  drawablyCheckbox,
  drawablyCircle,
  drawablyDivider,
  drawablyHighlight,
  drawablyInput,
  drawablyList,
  drawablyRadio,
  drawablySelect,
  drawablyTextarea,
  drawablyToggle,
  drawablyUnderline,
  type Sketch,
} from "./controls.js";
import {
  type DrawablyPagerOptions,
  type DrawablyTabsOptions,
  drawablyAlert,
  drawablyChip,
  drawablyKbd,
  drawablyPager,
  drawablyQuote,
  drawablySteps,
  drawablyTabs,
  drawablyTooltip,
  type PagerSketch,
  type TabsSketch,
} from "./composites.js";

function useSketch<T extends HTMLElement>(
  attach: (el: T) => Sketch,
  deps: readonly unknown[],
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    const sketch = attach(ref.current);
    return () => sketch.destroy();
  }, deps);
  return ref;
}

type ButtonProps = DrawablyButtonOptions & ComponentProps<"button">;

export function DrawablyButton({ seed, roughness, boil, stroke, fill, paper, width, variant, state, tone, className, children, ...rest }: ButtonProps): ReactElement {
  const sketchRef = useRef<ButtonSketch | null>(null);
  const ref = useSketch<HTMLButtonElement>(
    (el) => (sketchRef.current = drawablyButton(el, { seed, roughness, boil, stroke, fill, paper, width, variant, state, tone })),
    [seed, roughness, boil, stroke, fill, paper, width, variant, tone, className],
  );
  useEffect(() => {
    sketchRef.current?.setState(state ?? "idle");
  }, [state]);
  return createElement("button", { type: "button", ...rest, className, ref }, children);
}

type CheckboxProps = DrawablyOptions & ComponentProps<"input">;

export function DrawablyCheckbox({ seed, roughness, boil, stroke, fill, paper, width, className, ...rest }: CheckboxProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => drawablyCheckbox(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("span", { className, ref }, createElement("input", { ...rest, type: "checkbox" }));
}

type InputProps = DrawablyOptions & ComponentProps<"input">;

export function DrawablyInput({ seed, roughness, boil, stroke, fill, paper, width, className, ...rest }: InputProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => drawablyInput(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("span", { className, ref }, createElement("input", rest));
}

export function DrawablyRadio({ seed, roughness, boil, stroke, fill, paper, width, className, ...rest }: InputProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => drawablyRadio(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("span", { className, ref }, createElement("input", { ...rest, type: "radio" }));
}

export function DrawablyToggle({ seed, roughness, boil, stroke, fill, paper, width, className, ...rest }: CheckboxProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => drawablyToggle(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("span", { className, ref }, createElement("input", { ...rest, type: "checkbox", role: "switch" }));
}

type DividerProps = DrawablyOptions & ComponentProps<"hr">;

export function DrawablyDivider({ seed, roughness, boil, stroke, fill, paper, width, className, ...rest }: DividerProps): ReactElement {
  const ref = useSketch<HTMLHRElement>(
    (el) => drawablyDivider(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("hr", { ...rest, className, ref });
}

type CardProps = DrawablyOptions & ComponentProps<"div">;

export function DrawablyCard({ seed, roughness, boil, stroke, fill, paper, width, className, children, ...rest }: CardProps): ReactElement {
  const ref = useSketch<HTMLDivElement>(
    (el) => drawablyCard(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("div", { ...rest, className, ref }, children);
}

type SpanProps = DrawablyOptions & ComponentProps<"span">;

function decoration(attach: (el: HTMLSpanElement, opts: DrawablyOptions) => Sketch) {
  return function Decoration({ seed, roughness, boil, stroke, fill, paper, width, className, children, ...rest }: SpanProps): ReactElement {
    const ref = useSketch<HTMLSpanElement>(
      (el) => attach(el, { seed, roughness, boil, stroke, fill, paper, width }),
      [seed, roughness, boil, stroke, fill, paper, width, className],
    );
    return createElement("span", { ...rest, className, ref }, children);
  };
}

export const DrawablyUnderline = decoration(drawablyUnderline);
export const DrawablyHighlight = decoration(drawablyHighlight);
export const DrawablyCircle = decoration(drawablyCircle);

type ArrowProps = DrawablyOptions & {
  from: RefObject<HTMLElement | null>;
  to: RefObject<HTMLElement | null>;
};

export function DrawablyArrow({ from, to, seed, roughness, boil, stroke, fill, paper, width }: ArrowProps): null {
  useEffect(() => {
    if (!from.current || !to.current) return;
    const sketch = drawablyArrow(from.current, to.current, { seed, roughness, boil, stroke, fill, paper, width });
    return () => sketch.destroy();
  }, [from, to, seed, roughness, boil, stroke, fill, paper, width]);
  return null;
}

type TextareaProps = DrawablyOptions & ComponentProps<"textarea">;

export function DrawablyTextarea({ seed, roughness, boil, stroke, fill, paper, width, className, ...rest }: TextareaProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => drawablyTextarea(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("span", { className, ref }, createElement("textarea", rest));
}

type SelectProps = DrawablyOptions & ComponentProps<"select">;

export function DrawablySelect({ seed, roughness, boil, stroke, fill, paper, width, className, children, ...rest }: SelectProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => drawablySelect(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("span", { className, ref }, createElement("select", rest, children));
}

type BadgeProps = DrawablyBadgeOptions & ComponentProps<"span">;

export function DrawablyBadge({ seed, roughness, boil, stroke, fill, paper, width, variant, className, children, ...rest }: BadgeProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => drawablyBadge(el, { seed, roughness, boil, stroke, fill, paper, width, variant }),
    [seed, roughness, boil, stroke, fill, paper, width, variant, className],
  );
  return createElement("span", { ...rest, className, ref }, children);
}

type ListProps = DrawablyListOptions & ComponentProps<"ul">;

export function DrawablyList({ seed, roughness, boil, stroke, fill, paper, width, marker, className, children, ...rest }: ListProps): ReactElement {
  const ref = useSketch<HTMLUListElement>(
    (el) => drawablyList(el, { seed, roughness, boil, stroke, fill, paper, width, marker }),
    [seed, roughness, boil, stroke, fill, paper, width, marker, className],
  );
  return createElement("ul", { ...rest, className, ref }, children);
}

// composites

type ChipProps = DrawablyOptions & ComponentProps<"input"> & { children?: ReactNode };

export function DrawablyChip({ seed, roughness, boil, stroke, fill, paper, width, className, children, ...rest }: ChipProps): ReactElement {
  const ref = useSketch<HTMLLabelElement>(
    (el) => drawablyChip(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement(
    "label",
    { className, ref },
    createElement("span", null, createElement("input", { ...rest, type: "checkbox" })),
    children,
  );
}

type TabsProps = DrawablyTabsOptions & ComponentProps<"div">;

export function DrawablyTabs({ seed, roughness, boil, stroke, fill, paper, width, active, className, children, ...rest }: TabsProps): ReactElement {
  const sketchRef = useRef<TabsSketch | null>(null);
  const ref = useSketch<HTMLDivElement>(
    (el) => (sketchRef.current = drawablyTabs(el, { seed, roughness, boil, stroke, fill, paper, width, active })),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  useEffect(() => {
    if (active !== undefined) sketchRef.current?.setActive(active);
  }, [active]);
  return createElement("div", { role: "tablist", ...rest, className, ref }, children);
}

type TooltipProps = DrawablyOptions & ComponentProps<"span"> & { to: RefObject<HTMLElement | null> };

export function DrawablyTooltip({ to, seed, roughness, boil, stroke, fill, paper, width, className, children, ...rest }: TooltipProps): ReactElement {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || !to.current) return;
    const sketch = drawablyTooltip(ref.current, to.current, { seed, roughness, boil, stroke, fill, paper, width });
    return () => sketch.destroy();
  }, [to, seed, roughness, boil, stroke, fill, paper, width, className]);
  return createElement("span", { role: "tooltip", ...rest, className, ref }, children);
}

export function DrawablyAlert({ seed, roughness, boil, stroke, fill, paper, width, className, children, ...rest }: CardProps): ReactElement {
  const ref = useSketch<HTMLDivElement>(
    (el) => drawablyAlert(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("div", { role: "status", ...rest, className, ref }, children);
}

type StepsProps = DrawablyOptions & ComponentProps<"ol">;

export function DrawablySteps({ seed, roughness, boil, stroke, fill, paper, width, className, children, ...rest }: StepsProps): ReactElement {
  const ref = useSketch<HTMLOListElement>(
    (el) => drawablySteps(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("ol", { ...rest, className, ref }, children);
}

type KbdProps = DrawablyBadgeOptions & ComponentProps<"kbd">;

export function DrawablyKbd({ seed, roughness, boil, stroke, fill, paper, width, variant, className, children, ...rest }: KbdProps): ReactElement {
  const ref = useSketch<HTMLElement>(
    (el) => drawablyKbd(el, { seed, roughness, boil, stroke, fill, paper, width, variant }),
    [seed, roughness, boil, stroke, fill, paper, width, variant, className],
  );
  return createElement("kbd", { ...rest, className, ref }, children);
}

type QuoteProps = DrawablyOptions & ComponentProps<"blockquote">;

export function DrawablyQuote({ seed, roughness, boil, stroke, fill, paper, width, className, children, ...rest }: QuoteProps): ReactElement {
  const ref = useSketch<HTMLQuoteElement>(
    (el) => drawablyQuote(el, { seed, roughness, boil, stroke, fill, paper, width }),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  return createElement("blockquote", { ...rest, className, ref }, children);
}

type PagerProps = DrawablyPagerOptions & ComponentProps<"nav">;

export function DrawablyPager({ seed, roughness, boil, stroke, fill, paper, width, active, className, children, ...rest }: PagerProps): ReactElement {
  const sketchRef = useRef<PagerSketch | null>(null);
  const ref = useSketch<HTMLElement>(
    (el) => (sketchRef.current = drawablyPager(el, { seed, roughness, boil, stroke, fill, paper, width, active })),
    [seed, roughness, boil, stroke, fill, paper, width, className],
  );
  useEffect(() => {
    if (active !== undefined) sketchRef.current?.setPage(active);
  }, [active]);
  return createElement("nav", { ...rest, className, ref }, children);
}
