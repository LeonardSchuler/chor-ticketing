import type { SeatCategory } from "../models";

type PricingMap = { [category in SeatCategory]: number };

export class PricingService {
  //private concertId: string;
  private prices: PricingMap | null = null;

  //constructor(concertId: string) {
  //  this.concertId = concertId;
  //}
  async init() {
    //const res = await fetch(`/api/concerts/${this.concertId}/prices`);
    //this.prices = await res.json();
    this.prices = {
      "cat-1": 55,
      "cat-2": 65,
      "cat-3": 45,
      "cat-4": 35,
    };
  }

  getPrice(category: SeatCategory): number {
    if (!this.prices) throw new Error("PricingService not initialized");
    return this.prices[category];
  }
}
