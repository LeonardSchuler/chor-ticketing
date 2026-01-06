export type SeatStatus = "free" | "reserved" | "booked";

export const SeatStatus = {
  FREE: "free" as const,
  RESERVED: "reserved" as const,
  BOOKED: "booked" as const,
};

export type SeatCategory = "cat-1" | "cat-2" | "cat-3" | "cat-4";

export const SeatCategory = {
  CAT_1: "cat-1" as const,
  CAT_2: "cat-2" as const,
  CAT_3: "cat-3" as const,
  CAT_4: "cat-4" as const,
};

export interface Seat {
  id: string;
  eventId: string;
  number: string; // The actual seat number from the venue (e.g., "1630", "1632")
  category: SeatCategory;
  status: SeatStatus;
}

export interface ReservedSeat extends Seat {
  status: typeof SeatStatus.RESERVED;
  reservationId: string;
  expiresAt: Date;
}
