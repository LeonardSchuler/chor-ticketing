import type { CartItem, CartSummary } from "../models/cart-item";
import type { Seat } from "../models/seat";

export class CartService {
  private items: Map<string, CartItem> = new Map();

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
  }

  removeItem(seatId: string): CartItem | undefined {
    const item = this.items.get(seatId);
    if (item) {
      this.items.delete(seatId);
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
    return true;
  }

  clear(): CartItem[] {
    const items = this.getAllItems();
    this.items.clear();
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
