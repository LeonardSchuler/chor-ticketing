import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SeatsMap } from "./SeatsMap";

describe("SeatsMap Component", () => {
  let container: HTMLDivElement;
  let mockSvg: SVGElement;

  beforeEach(() => {
    // Register the custom element if not already registered
    if (!customElements.get("seats-map")) {
      customElements.define("seats-map", SeatsMap);
    }

    container = document.createElement("div");
    document.body.appendChild(container);

    // Create a mock SVG with some test seats
    mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    mockSvg.setAttribute("viewBox", "0 0 100 100");

    // Add a couple of mock seats
    for (let i = 1; i <= 3; i++) {
      const seat = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g",
      );
      seat.classList.add("seat", `cat-${i}`);
      seat.setAttribute("data-number", `${i}`);
      mockSvg.appendChild(seat);
    }
  });

  afterEach(() => {
    container.remove();
  });

  describe("Rendering", () => {
    it("contains a styled svg", () => {
      const seatsMap = new SeatsMap();
      container.appendChild(seatsMap);
      seatsMap.init(mockSvg);

      const shadow = seatsMap.shadowRoot;
      const svgElement = shadow?.querySelector("svg");
      expect(svgElement).toBeDefined();

      const styleElement = seatsMap.shadowRoot?.querySelector("style");
      expect(styleElement?.textContent).toBeDefined();
    });

    it("has seats", () => {
      const seatsMap = new SeatsMap();
      container.appendChild(seatsMap);
      seatsMap.init(mockSvg);

      const shadow = seatsMap.shadowRoot;
      expect(shadow?.querySelectorAll(".seat")?.length).greaterThan(0);
    });
  });

  describe("Interactions", () => {
    it("dispatches seat-selected event when seat is clicked", () => {
      const seatsMap = new SeatsMap();
      container.appendChild(seatsMap);
      seatsMap.init(mockSvg);

      let eventFired = false;
      let eventDetail: { seatNumber: string } | null = null;

      window.addEventListener("seat-selected", ((event: CustomEvent) => {
        eventFired = true;
        eventDetail = event.detail as { seatNumber: string };
      }) as EventListener);

      const shadow = seatsMap.shadowRoot;
      const firstSeat = shadow?.querySelector(".seat") as SVGElement;

      // Dispatch click event manually for SVG elements
      firstSeat?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(eventFired).toBe(true);
      expect(eventDetail).not.toBeNull();
      expect(eventDetail!.seatNumber).toBe("1");
    });
  });
});
