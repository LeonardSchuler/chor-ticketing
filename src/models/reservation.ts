import type { Seat } from "./seat";

export interface Reservation {
  id: string;
  seatId: string;
  eventId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface ReservationRequest {
  seatId: string;
  eventId?: string; // Optional - uses current event from EventContextService if not provided
  durationMinutes?: number; // defaults to 15 minutes
}

export interface ReservationResponse {
  success: boolean;
  reservation?: Reservation;
  seat?: Seat;
  error?: string;
}
