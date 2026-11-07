import type { SeatCategory } from "../models/seat";

export class PriceLegend extends HTMLElement {
  private _prices: Partial<Record<SeatCategory, number>> = {};

  set prices(value: Partial<Record<SeatCategory, number>>) {
    this._prices = value;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  private render() {
    const entries = Object.entries(this._prices).sort(([a], [b]) => a.localeCompare(b)) as [
      SeatCategory,
      number,
    ][];

    this.innerHTML = `
      <ul class="flex flex-col gap-3 mt-8 text-base" aria-label="Preise">
        ${entries
          .map(
            ([category, price]) => `
          <li class="flex items-center gap-3">
            <span class="inline-block w-7 h-7 rounded-md border border-black/40"
              style="background: var(--${category}-free)"></span>
            <span>Kategorie ${category.replace("cat-", "")}: <strong>CHF ${price.toFixed(2)}</strong></span>
          </li>`,
          )
          .join("")}
      </ul>
    `;
  }
}
