import type { SeatCategory } from "../models/seat";

type PricingMap = { [category in SeatCategory]: number };

export class PricingService {
  private prices: PricingMap | null = null;

  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = "/api") {
    this.apiBaseUrl = apiBaseUrl;
  }

  async init(eventId: string): Promise<void> {
    const res = await fetch(`${this.apiBaseUrl}/events/${eventId}/prices`);
    if (!res.ok) throw new Error(`Failed to load prices for event ${eventId}`);
    const raw = (await res.json()) as Record<string, number>;
    // API keys categories by number ("1"); the frontend uses "cat-1"
    this.prices = Object.fromEntries(
      Object.entries(raw).map(([category, price]) => [`cat-${category}`, price]),
    ) as PricingMap;
  }

  getPrice(category: SeatCategory): number {
    if (!this.prices) throw new Error("PricingService not initialized");
    return this.prices[category];
  }
}
