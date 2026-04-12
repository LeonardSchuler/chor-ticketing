import type { Seat } from "../models/seat";
import { SeatStatus } from "../models/seat";
import type {
  Reservation,
  ReservationRequest,
  ReservationResponse,
} from "../models/reservation";
import type { SeatLayout } from "../infrastructure/svgSeatLayoutAdapter";

export class SeatService {
  private seats: Map<string, Seat> = new Map();
  private reservations: Map<string, Reservation> = new Map();
  private cleanupIntervalId?: number;
  private currentEventId: string = "";

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Initialize seats for an event from seat layout data.
   * @param layout - Array of seat layout data (number + category)
   * @param eventId - The event these seats belong to
   */
  initializeSeats(layout: SeatLayout[], eventId: string): void {
    this.currentEventId = eventId;

    layout.forEach(({ number, category }) => {
      const seat: Seat = {
        id: `seat-${number}`,
        eventId,
        number,
        category,
        status: SeatStatus.FREE,
      };

      this.seats.set(seat.id, seat);
    });

    console.log(`✅ Initialized ${this.seats.size} seats for event ${eventId}`);
  }

  getSeat(seatId: string): Seat | undefined {
    return this.seats.get(seatId);
  }

  /**
   * Get all seats for the current event.
   * @param eventId - Optional event ID to filter by. Defaults to the initialized event.
   */
  getAllSeats(eventId?: string): Seat[] {
    const targetEventId = eventId ?? this.currentEventId;
    return Array.from(this.seats.values()).filter(
      (seat) => seat.eventId === targetEventId,
    );
  }

  /**
   * Reserve a seat for the current event.
   * @param request - Reservation request with seatId and optional eventId
   */
  reserveSeat(request: ReservationRequest): ReservationResponse {
    const seat = this.seats.get(request.seatId);

    if (!seat) {
      return {
        success: false,
        error: "Seat not found",
      };
    }

    if (seat.status !== SeatStatus.FREE) {
      return {
        success: false,
        error: "Seat is not available",
      };
    }

    const eventId = request.eventId ?? this.currentEventId;

    if (seat.eventId !== eventId) {
      return {
        success: false,
        error: "Seat does not belong to the specified event",
      };
    }

    const durationMinutes = request.durationMinutes || 15;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const reservation: Reservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      seatId: request.seatId,
      eventId,
      createdAt: now,
      expiresAt,
    };

    seat.status = SeatStatus.RESERVED;
    this.seats.set(seat.id, seat);
    this.reservations.set(reservation.id, reservation);

    return {
      success: true,
      reservation,
      seat,
    };
  }

  releaseReservation(reservationId: string): boolean {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      return false;
    }

    const seat = this.seats.get(reservation.seatId);
    if (seat && seat.status === SeatStatus.RESERVED) {
      seat.status = SeatStatus.FREE;
      this.seats.set(seat.id, seat);
    }

    this.reservations.delete(reservationId);
    return true;
  }

  getReservation(reservationId: string): Reservation | undefined {
    return this.reservations.get(reservationId);
  }

  private startCleanupInterval(): void {
    this.cleanupIntervalId = window.setInterval(() => {
      this.cleanupExpiredReservations();
    }, 10000);
  }

  private cleanupExpiredReservations(): void {
    const now = new Date();
    const expiredReservations: string[] = [];

    this.reservations.forEach((reservation, reservationId) => {
      if (reservation.expiresAt < now) {
        expiredReservations.push(reservationId);
      }
    });

    expiredReservations.forEach((reservationId) => {
      this.releaseReservation(reservationId);
    });
  }

  stopCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
  }

  // For testing/development - mark seat as booked
  bookSeat(seatId: string): boolean {
    const seat = this.seats.get(seatId);
    if (!seat) return false;

    seat.status = SeatStatus.BOOKED;
    this.seats.set(seat.id, seat);
    return true;
  }
}
