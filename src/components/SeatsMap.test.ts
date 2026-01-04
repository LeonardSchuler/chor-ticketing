import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "./SeatsMap";

describe("SeatsMap Component", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("Rendering", () => {
    it("contains a styled svg", () => {
      const seatsMap = document.createElement("seats-map");
      container.appendChild(seatsMap);

      const shadow = seatsMap.shadowRoot;
      const svgElement = shadow?.querySelector("svg");
      expect(svgElement).toBeDefined();

      const styleElement = seatsMap.shadowRoot?.querySelector("style");
      expect(styleElement?.textContent).toBeDefined();
    });
    it("has seats", () => {
      const seatsMap = document.createElement("seats-map");
      container.appendChild(seatsMap);

      const shadow = seatsMap.shadowRoot;
      expect(shadow?.querySelectorAll(".seat")?.length).greaterThan(0);
    });
  });

  describe("Interactions", () => {});
});
