// src/infrastructure/svg-seat-layout-adapter.ts
import type { SeatCategory } from "../models/seat";

export type SeatLayout = {
  number: string;
  category: SeatCategory;
};

export type SeatLayoutResult = {
  seats: SeatLayout[];
  svgElement: SVGElement;
};

/**
 * Infrastructure adapter for loading seat layouts from SVG files.
 * This adapter isolates SVG parsing logic from domain services.
 */
export class SvgSeatLayoutAdapter {
  /**
   * Loads and parses a seat layout from an SVG file.
   * @param svgPath - Path to the SVG file containing seat layout
   * @returns Object containing seat layout data and the SVG element
   */
  async load(svgPath: string): Promise<SeatLayoutResult> {
    try {
      const response = await fetch(svgPath);
      const svgText = await response.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

      // Extract the SVG element
      const svgElement = svgDoc.querySelector("svg");
      if (!svgElement) {
        throw new Error("No SVG element found in the document");
      }

      // Find all seat elements (g elements with class="seat cat-X")
      const seatElements = svgDoc.querySelectorAll("g.seat");

      const seatLayouts: SeatLayout[] = [];

      seatElements.forEach((element) => {
        // Cast to SVGElement since querySelectorAll on SVG returns SVG elements
        const seatElement = element as SVGElement;
        const seatNumber = seatElement.getAttribute("data-number");

        if (!seatNumber) return;

        const categoryClass = Array.from(seatElement.classList).find((cls) =>
          cls.startsWith("cat-")
        );
        if (!categoryClass) return;
        const categoryMatch = categoryClass.match(/cat-(\d+)/);
        if (!categoryMatch) return;

        const categoryNumber: string = categoryMatch[1];
        const category = `cat-${categoryNumber}` as SeatCategory;

        seatLayouts.push({
          number: seatNumber,
          category,
        });
      });

      console.log(`Loaded ${seatLayouts.length} seats from SVG`);
      return {
        seats: seatLayouts,
        svgElement,
      };
    } catch (error) {
      console.error("Failed to load seats from SVG:", error);
      throw error;
    }
  }
}
