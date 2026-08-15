import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { DrawablyButton, DrawablyCheckbox } from "../src/react.js";

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
