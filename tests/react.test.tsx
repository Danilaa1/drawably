import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ScrawlButton, ScrawlCheckbox } from "../src/react.js";

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

it("ScrawlButton renders a button and attaches chrome on mount", () => {
  act(() => root.render(<ScrawlButton seed={1}>Done</ScrawlButton>));
  const button = host.querySelector("button");
  expect(button?.textContent).toBe("Done");
  expect(button?.querySelectorAll("path.scrawl-boil.scrawl-outline")).toHaveLength(3);
});

it("ScrawlButton detaches on unmount", () => {
  act(() => root.render(<ScrawlButton seed={1}>Done</ScrawlButton>));
  act(() => root.render(<span />));
  expect(host.querySelector("svg")).toBeNull();
});

it("ScrawlCheckbox wires the inner input", () => {
  act(() => root.render(<ScrawlCheckbox seed={1} defaultChecked />));
  const wrap = host.querySelector("span.scrawl-checkbox");
  expect(wrap?.querySelector('input[type="checkbox"]')).toBeTruthy();
  expect(wrap?.hasAttribute("data-checked")).toBe(true);
});

it("ScrawlButton survives a className change without losing its scrawl classes", () => {
  act(() => root.render(<ScrawlButton seed={1} className="a">Done</ScrawlButton>));
  act(() => root.render(<ScrawlButton seed={1} className="b">Done</ScrawlButton>));
  const button = host.querySelector("button");
  expect(button?.classList.contains("b")).toBe(true);
  expect(button?.classList.contains("scrawl-host")).toBe(true);
  expect(button?.classList.contains("scrawl-button")).toBe(true);
  expect(button?.querySelector("svg")).toBeTruthy();
});
