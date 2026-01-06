import type { Seat } from "./seat";

export interface CartItem {
  seat: Seat;
  price: number;
  discount: number; // percentage (0-100)
  reservationId: string;
  expiresAt: Date;
  addedAt: Date;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  total: number;
  itemCount: number;
}
