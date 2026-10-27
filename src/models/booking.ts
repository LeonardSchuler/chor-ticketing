import type { Seat } from "./seat";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export const BookingStatus = {
  PENDING: "pending" as const,
  CONFIRMED: "confirmed" as const,
  CANCELLED: "cancelled" as const,
};

/** One reserved seat in a purchase, with the price the customer pays for it. */
export interface PurchaseItem {
  reservationId: string;
  price: number;
  discount: number; // percentage (0-100)
}

export interface Booking {
  id: string;
  eventId: string;
  seats: Seat[];
  totalAmount: number;
  customerEmail: string;
  createdAt: Date;
  status: BookingStatus;
}
