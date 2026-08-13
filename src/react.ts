import {
  type ComponentProps,
  createElement,
  type ReactElement,
  useEffect,
  useRef,
} from "react";
import {
  type ScrawlButtonOptions,
  type ScrawlOptions,
  scrawlButton,
  scrawlCard,
  scrawlCheckbox,
  scrawlInput,
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

type ButtonProps = ScrawlButtonOptions & ComponentProps<"button">;

export function ScrawlButton({ seed, roughness, stroke, fill, variant, children, ...rest }: ButtonProps): ReactElement {
  const ref = useSketch<HTMLButtonElement>(
    (el) => scrawlButton(el, { seed, roughness, stroke, fill, variant }),
    [seed, roughness, stroke, fill, variant],
  );
  return createElement("button", { type: "button", ...rest, ref }, children);
}

type CheckboxProps = ScrawlOptions & ComponentProps<"input">;

export function ScrawlCheckbox({ seed, roughness, stroke, fill, ...rest }: CheckboxProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => scrawlCheckbox(el, { seed, roughness, stroke, fill }),
    [seed, roughness, stroke, fill],
  );
  return createElement("span", { ref }, createElement("input", { ...rest, type: "checkbox" }));
}

type InputProps = ScrawlOptions & ComponentProps<"input">;

export function ScrawlInput({ seed, roughness, stroke, fill, ...rest }: InputProps): ReactElement {
  const ref = useSketch<HTMLSpanElement>(
    (el) => scrawlInput(el, { seed, roughness, stroke, fill }),
    [seed, roughness, stroke, fill],
  );
  return createElement("span", { ref }, createElement("input", rest));
}

type CardProps = ScrawlOptions & ComponentProps<"div">;

export function ScrawlCard({ seed, roughness, stroke, fill, children, ...rest }: CardProps): ReactElement {
  const ref = useSketch<HTMLDivElement>(
    (el) => scrawlCard(el, { seed, roughness, stroke, fill }),
    [seed, roughness, stroke, fill],
  );
  return createElement("div", { ...rest, ref }, children);
}
