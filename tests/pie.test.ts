import { afterEach, describe, expect, it, vi } from "vitest";
import { drawablyPieChart, type DrawablyPieDatum, type DrawablyPieChartOptions } from "../src/controls.js";
import { roughCircle, roughPieSlice } from "../src/rough.js";

const data = [
  { label: "Overexcitement and frustration", value: 60 },
  { label: "Learned habit", value: 40 },
  { label: "Fear", value: 0 },
  { label: "Aggression", value: 0 },
];
const cleanups: (() => void)[] = [];
function mount(options: Partial<DrawablyPieChartOptions> = {}) {
  const host = document.createElement("div");
  document.body.append(host);
  const sketch = drawablyPieChart(host, { data, seed: 42, ...options });
  cleanups.push(() => { sketch.destroy(); host.remove(); });
  return { host, sketch };
}
function paths(host: Element) {
  return [...host.querySelectorAll(".drawably-outline")].map(p => p.getAttribute("d"));
}
afterEach(() => { cleanups.splice(0).forEach(fn => fn()); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("roughPieSlice", () => {
  const o = { seed: 42, roughness: 1, boil: 0 };
  it("uses seeded, closed double strokes and the existing full circle", () => {
    const d = roughPieSlice(100, 100, 90, 0, Math.PI, o);
    expect(d).toBe(roughPieSlice(100, 100, 90, 0, Math.PI, o));
    expect(d).not.toBe(roughPieSlice(100, 100, 90, 0, Math.PI, { ...o, seed: 1 }));
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.match(/Z/g)).toHaveLength(2);
    expect(roughPieSlice(100, 100, 90, 0, Math.PI * 2, o)).toBe(roughCircle(100, 100, 90, o));
  });
  it("handles empty and invalid geometry", () => {
    expect(roughPieSlice(0, 0, 90, 0, 0, o)).toBe("");
    expect(roughPieSlice(0, 0, 0, 0, 1, o)).toBe("");
    expect(() => roughPieSlice(0, 0, -1, 0, 1, o)).toThrow();
    expect(() => roughPieSlice(0, 0, 1, 0, Infinity, o)).toThrow();
  });
});

describe("drawablyPieChart", () => {
  it("rejects bad elements and data before modifying the host", () => {
    expect(() => drawablyPieChart(null as unknown as HTMLElement, { data })).toThrow();
    const host = document.createElement("div");
    host.innerHTML = "<p>Keep me</p>";
    for (const value of [-1, Infinity, NaN, "3"])
      expect(() => drawablyPieChart(host, { data: [{ label: "bad", value }] as DrawablyPieDatum[] })).toThrow();
    expect(() => drawablyPieChart(host, {} as DrawablyPieChartOptions)).toThrow();
    expect(() => drawablyPieChart(host, { data, roughness: Infinity })).toThrow();
    expect(host.innerHTML).toBe("<p>Keep me</p>");
  });
  it("draws only positive slices and retains zero values in accessible HTML", () => {
    const { host } = mount();
    expect(host.querySelectorAll(".drawably-pie-slice")).toHaveLength(2);
    expect(host.querySelectorAll(".drawably-outline")).toHaveLength(6);
    expect(host.querySelectorAll(".drawably-scribble")).toHaveLength(6);
    expect(host.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect([...host.querySelectorAll("li")].map(li => li.textContent)).toEqual(data.map(d => `${d.label}: ${d.value}%`));
    expect(host.querySelector("clipPath path")?.getAttribute("d")).toContain(" 0 1 1 ");
  });
  it("has deterministic geometry across mounts, updates and resketches", () => {
    const first = mount(), second = mount();
    const initial = paths(first.host);
    expect(initial).toEqual(paths(second.host));
    first.sketch.resketch(7);
    expect(paths(first.host)).not.toEqual(initial);
    first.sketch.resketch(42);
    expect(paths(first.host)).toEqual(initial);
    first.sketch.setData([{ label: "Only", value: 1 }]);
    first.sketch.setData(data);
    expect(paths(first.host)).toEqual(initial);
  });
  it("uses unique clip IDs per chart and keeps all references local", () => {
    const charts = [mount(), mount()];
    const ids = charts.flatMap(({ host }) => [...host.querySelectorAll("clipPath")].map(p => p.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const { host, sketch } of charts) {
      sketch.setData(data);
      for (const g of host.querySelectorAll("[clip-path]")) {
        const id = g.getAttribute("clip-path")!.slice(5, -1);
        expect(host.querySelector(`#${id}`)).not.toBeNull();
      }
    }
  });
  it("boil zero draws one static frame; hidden legends remain accessible", () => {
    const { host } = mount({ boil: 0, showLegend: false });
    expect(host.querySelectorAll(".drawably-outline")).toHaveLength(2);
    expect(host.querySelector(".drawably-boil")).toBeNull();
    const legend = host.querySelector("ul")!;
    expect(legend.classList.contains("drawably-pie-hidden")).toBe(true);
    expect(legend.hasAttribute("aria-hidden")).toBe(false);
    expect(legend.textContent).toContain("Fear: 0%");
  });
  it("normalizes weights, including huge finite values, and preserves tiny nonzero labels", () => {
    const { host, sketch } = mount({ data: [{ label: "A", value: 3 }, { label: "B", value: 1 }] });
    expect(host.textContent).toContain("A: 75%");
    sketch.setData([{ label: "A", value: Number.MAX_VALUE }, { label: "B", value: Number.MAX_VALUE }]);
    expect(host.textContent).toContain("A: 50%");
    expect(paths(host).join()).not.toMatch(/NaN|Infinity/);
    sketch.setData([{ label: "A", value: 10000 }, { label: "B", value: 1 }]);
    expect(host.textContent).toContain("B: <0.1%");
  });
  it("renders a full circle for one positive value and an empty state for all zeros", () => {
    const { host, sketch } = mount({ data: [{ label: "Only", value: 1 }] });
    expect(host.querySelector("clipPath circle")).not.toBeNull();
    expect(host.textContent).toContain("100%");
    sketch.setData([{ label: "Zero", value: 0 }]);
    expect(host.querySelectorAll(".drawably-pie-slice")).toHaveLength(0);
    expect(host.textContent).toContain("No data");
    expect(host.textContent).toContain("Zero: 0%");
    sketch.setData([]);
    expect(host.textContent).toBe("No data");
  });
  it("copies input, renders labels as text and rejects invalid updates atomically", () => {
    const input = [{ label: "<img src=x onerror=alert(1)>", value: 1 }];
    const { host, sketch } = mount({ data: input });
    expect(host.querySelector("img")).toBeNull();
    input[0].value = 0;
    sketch.resketch(42);
    expect(host.textContent).toContain("100%");
    const before = host.innerHTML;
    expect(() => sketch.setData([{ label: "Bad", value: -1 }])).toThrow();
    expect(host.innerHTML).toBe(before);
  });
  it("redraws on resize and cleans up observers, font listeners and owned content", () => {
    let resize = () => {};
    const disconnect = vi.fn(), observe = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: () => void) { resize = callback; }
      observe = observe;
      disconnect = disconnect;
    });
    const { host, sketch } = mount();
    const plot = host.querySelector<HTMLElement>(".drawably-pie-plot")!;
    Object.defineProperty(plot, "clientWidth", { value: 420, configurable: true });
    resize();
    expect(host.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 420 420");
    const child = document.createElement("p"); child.textContent = "Preserved"; host.append(child);
    const fonts = document.fonts && vi.spyOn(document.fonts, "removeEventListener");
    sketch.destroy(); sketch.destroy(); resize(); sketch.resketch(1); sketch.setData(data);
    expect(disconnect).toHaveBeenCalled();
    if (fonts) expect(fonts).toHaveBeenCalledWith("loadingdone", expect.any(Function));
    expect(host.innerHTML).toBe("<p>Preserved</p>");
  });
});
