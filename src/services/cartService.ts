import type { CartItem, CartSummary } from "../models/cartItem";
import type { Seat } from "../models/seat";

const STORAGE_KEY = "chor-ticketing:cart";

export interface StoredCartItem {
  seatId: string;
  reservationId: string;
  discount: number;
}

export class CartService {
  private items: Map<string, CartItem> = new Map();

  /**
   * Read the cart persisted by a previous page load. Only identifiers are
   * stored; the caller reconciles them against the backend's active reservations.
   */
  loadStored(): StoredCartItem[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      return Array.isArray(parsed) ? (parsed as StoredCartItem[]) : [];
    } catch {
      return [];
    }
  }

  persist(): void {
    const stored: StoredCartItem[] = this.getAllItems().map((item) => ({
      seatId: item.seat.id,
      reservationId: item.reservationId,
      discount: item.discount,
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage unavailable (private mode / quota): cart simply won't survive a reload
    }
  }

  addItem(
    seat: Seat,
    price: number,
    reservationId: string,
    expiresAt: Date,
  ): void {
    const item: CartItem = {
      seat,
      price,
      discount: 0,
      reservationId,
      expiresAt,
      addedAt: new Date(),
    };

    this.items.set(seat.id, item);
    this.persist();
  }

  removeItem(seatId: string): CartItem | undefined {
    const item = this.items.get(seatId);
    if (item) {
      this.items.delete(seatId);
      this.persist();
    }
    return item;
  }

  getItem(seatId: string): CartItem | undefined {
    return this.items.get(seatId);
  }

  getAllItems(): CartItem[] {
    return Array.from(this.items.values());
  }

  updateDiscount(seatId: string, discountPercent: number): boolean {
    const item = this.items.get(seatId);
    if (!item) return false;

    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error("Discount must be between 0 and 100");
    }

    item.discount = discountPercent;
    this.items.set(seatId, item);
    this.persist();
    return true;
  }

  clear(): CartItem[] {
    const items = this.getAllItems();
    this.items.clear();
    this.persist();
    return items;
  }

  getSummary(): CartSummary {
    const items = this.getAllItems();
    let subtotal = 0;
    let total = 0;

    items.forEach((item) => {
      subtotal += item.price;
      const discountedPrice = item.price * (1 - item.discount / 100);
      total += discountedPrice;
    });

    return {
      items,
      subtotal,
      totalDiscount: subtotal - total,
      total,
      itemCount: items.length,
    };
  }

  isEmpty(): boolean {
    return this.items.size === 0;
  }

  hasItem(seatId: string): boolean {
    return this.items.has(seatId);
  }
}
