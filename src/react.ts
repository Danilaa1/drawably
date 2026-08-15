import {
  type ComponentProps,
  createElement,
  type ReactElement,
  useEffect,
  useRef,
} from "react";
import {
  type ButtonSketch,
  type DrawablyButtonOptions,
  type DrawablyOptions,
  drawablyButton,
  drawablyCard,
  drawablyCheckbox,
  drawablyDivider,
  drawablyInput,
  drawablyRadio,
  drawablyToggle,
  type Sketch,
} from "./controls.js";

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
