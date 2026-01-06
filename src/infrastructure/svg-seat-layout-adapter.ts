// src/infrastructure/svg-seat-layout-adapter.ts
import type { SeatCategory } from "../models/seat";

export type SeatLayout = {
  number: string;
  category: SeatCategory;
};

/**
 * Infrastructure adapter for loading seat layouts from SVG files.
 * This adapter isolates SVG parsing logic from domain services.
 */
export class SvgSeatLayoutAdapter {
  /**
   * Loads and parses a seat layout from an SVG file.
   * @param svgPath - Path to the SVG file containing seat layout
   * @returns Array of seat layout data (seat number + category)
   */
  async load(svgPath: string): Promise<SeatLayout[]> {
    try {
      const response = await fetch(svgPath);
      const svgText = await response.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

      // Find all seat elements (g elements with class="seat cat-X")
      const seatElements = svgDoc.querySelectorAll("g.seat");

      const seatLayouts: SeatLayout[] = [];

      seatElements.forEach((element) => {
        // Cast to SVGElement since querySelectorAll on SVG returns SVG elements
        const svgElement = element as SVGElement;
        const seatNumber = svgElement.getAttribute("data-number");

        if (!seatNumber) return;

        // SVGElement.className is SVGAnimatedString with baseVal property
        // TypeScript struggles with this type, so we explicitly handle it
        const classNameAnimated = svgElement.className as SVGAnimatedString;
        const classList: string = classNameAnimated.baseVal;

        // Extract category from class list (e.g., "seat cat-4" -> "cat-4")
        const categoryMatch: RegExpMatchArray | null =
          classList.match(/cat-(\d+)/);
        if (!categoryMatch || categoryMatch.length < 2) return;

        const categoryNumber: string = categoryMatch[1];
        const category = `cat-${categoryNumber}` as SeatCategory;

        seatLayouts.push({
          number: seatNumber,
          category,
        });
      });

      console.log(`✅ Loaded ${seatLayouts.length} seats from SVG`);
      return seatLayouts;
    } catch (error) {
      console.error("Failed to load seats from SVG:", error);
      throw error;
    }
  }
}
