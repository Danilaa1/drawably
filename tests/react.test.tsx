import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { useRef } from "react";
import { DrawablyArrow, DrawablyBadge, DrawablyButton, DrawablyCheckbox, DrawablyCircle, DrawablyHighlight, DrawablyList, DrawablySelect, DrawablyTextarea, DrawablyUnderline } from "../src/react.js";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

it("DrawablyButton renders a button and attaches chrome on mount", () => {
  act(() => root.render(<DrawablyButton seed={1}>Done</DrawablyButton>));
  const button = host.querySelector("button");
  expect(button?.textContent).toBe("Done");
  expect(button?.querySelectorAll("path.drawably-boil.drawably-outline")).toHaveLength(3);
});

it("DrawablyButton detaches on unmount", () => {
  act(() => root.render(<DrawablyButton seed={1}>Done</DrawablyButton>));
  act(() => root.render(<span />));
  expect(host.querySelector("svg")).toBeNull();
});

it("DrawablyCheckbox wires the inner input", () => {
  act(() => root.render(<DrawablyCheckbox seed={1} defaultChecked />));
  const wrap = host.querySelector("span.drawably-checkbox");
  expect(wrap?.querySelector('input[type="checkbox"]')).toBeTruthy();
  expect(wrap?.hasAttribute("data-checked")).toBe(true);
});

it("DrawablyButton reflects the state prop as data-state", () => {
  act(() => root.render(<DrawablyButton seed={1} state="loading">Done</DrawablyButton>));
  expect(host.querySelector("button")?.dataset.state).toBe("loading");
  act(() => root.render(<DrawablyButton seed={1} state="success">Done</DrawablyButton>));
  expect(host.querySelector("button")?.dataset.state).toBe("success");
  act(() => root.render(<DrawablyButton seed={1}>Done</DrawablyButton>));
  expect(host.querySelector("button")?.dataset.state).toBeUndefined();
});

it("DrawablyButton keeps its sketch across state changes", () => {
  act(() => root.render(<DrawablyButton>Done</DrawablyButton>));
  const d = host.querySelector("path")?.getAttribute("d");
  act(() => root.render(<DrawablyButton state="loading">Done</DrawablyButton>));
  expect(host.querySelector("button")?.dataset.state).toBe("loading");
  expect(host.querySelector("path")?.getAttribute("d")).toBe(d);
});

it("DrawablyButton survives a className change without losing its drawably classes", () => {
  act(() => root.render(<DrawablyButton seed={1} className="a">Done</DrawablyButton>));
  act(() => root.render(<DrawablyButton seed={1} className="b">Done</DrawablyButton>));
  const button = host.querySelector("button");
  expect(button?.classList.contains("b")).toBe(true);
  expect(button?.classList.contains("drawably-host")).toBe(true);
  expect(button?.classList.contains("drawably-button")).toBe(true);
  expect(button?.querySelector("svg")).toBeTruthy();
});

it("inline decorations render a span with the sketch", () => {
  act(() =>
    root.render(
      <p>
        <DrawablyUnderline seed={1}>a</DrawablyUnderline>
        <DrawablyHighlight seed={1}>b</DrawablyHighlight>
        <DrawablyCircle seed={1}>c</DrawablyCircle>
      </p>,
    ),
  );
  expect(host.querySelector("span.drawably-underline path.drawably-outline")).toBeTruthy();
  expect(host.querySelector("span.drawably-highlight path.drawably-wash")).toBeTruthy();
  expect(host.querySelector("span.drawably-circle path.drawably-outline")).toBeTruthy();
});

it("DrawablyArrow draws between two refs and cleans up on unmount", () => {
  function Demo() {
    const a = useRef<HTMLSpanElement>(null);
    const b = useRef<HTMLSpanElement>(null);
    return (
      <p>
        <span ref={a}>from</span>
        <span ref={b}>to</span>
        <DrawablyArrow from={a} to={b} seed={1} />
      </p>
    );
  }
  act(() => root.render(<Demo />));
  expect(document.body.querySelector("svg.drawably-arrow path")).toBeTruthy();
  act(() => root.render(<span />));
  expect(document.body.querySelector("svg.drawably-arrow")).toBeNull();
});

it("form set wrappers render native fields inside sketched wrappers", () => {
  act(() =>
    root.render(
      <form>
        <DrawablyTextarea seed={1} name="msg" />
        <DrawablySelect seed={1} name="pick">
          <option>a</option>
        </DrawablySelect>
        <DrawablyBadge seed={1} variant="scribble">new</DrawablyBadge>
        <DrawablyList seed={1} marker="check">
          <li>one</li>
          <li>two</li>
        </DrawablyList>
      </form>,
    ),
  );
  expect(host.querySelector("span.drawably-textarea textarea[name=msg]")).toBeTruthy();
  expect(host.querySelector("span.drawably-select select[name=pick] option")).toBeTruthy();
  expect(host.querySelector("span.drawably-badge--scribble path.drawably-scribble")).toBeTruthy();
  expect(host.querySelectorAll("ul.drawably-list li > svg")).toHaveLength(2);
});
