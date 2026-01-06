import type { Seat } from "./seat";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export const BookingStatus = {
  PENDING: "pending" as const,
  CONFIRMED: "confirmed" as const,
  CANCELLED: "cancelled" as const,
};

export interface Booking {
  id: string;
  eventId: string;
  seats: Seat[];
  totalAmount: number;
  customerEmail: string;
  createdAt: Date;
  status: BookingStatus;
}
