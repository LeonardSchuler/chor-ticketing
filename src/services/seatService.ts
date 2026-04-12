import type { Seat } from "../models/seat";
import { SeatStatus } from "../models/seat";
import type {
  Reservation,
  ReservationRequest,
  ReservationResponse,
} from "../models/reservation";
import type { SeatLayout } from "../infrastructure/svgSeatLayoutAdapter";
import type { EventContextService } from "./eventContextService";

export class SeatService {
  private seats: Map<string, Seat> = new Map();
  private reservations: Map<string, Reservation> = new Map();
  private cleanupIntervalId?: number;
  private eventContextService: EventContextService;

  constructor(eventContextService: EventContextService) {
    this.eventContextService = eventContextService;
    // Start cleanup interval to remove expired reservations
    this.startCleanupInterval();
  }

  /**
   * Initialize seats for an event from seat layout data.
   * This method is infrastructure-agnostic and doesn't know about SVG.
   * Uses the current event from EventContextService.
   * @param layout - Array of seat layout data (number + category)
   */
  initializeSeats(layout: SeatLayout[]): void {
    const eventId = this.eventContextService.getCurrentEventId();

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
   * If eventId is provided, filters by that event instead (useful for multi-event scenarios).
   * @param eventId - Optional event ID to filter by. If not provided, uses current event.
   * @returns Array of seats
   */
  getAllSeats(eventId?: string): Seat[] {
    const targetEventId = eventId ?? this.eventContextService.getCurrentEventId();
    return Array.from(this.seats.values()).filter(
      (seat) => seat.eventId === targetEventId,
    );
  }

  /**
   * Reserve a seat for the current event.
   * Uses the current event from EventContextService if not provided in request.
   * @param request - Reservation request with seatId and optional eventId
   * @returns Reservation response with success status and details
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

    // Use eventId from request, or fall back to current event
    const eventId = request.eventId ?? this.eventContextService.getCurrentEventId();

    // Verify the seat belongs to the target event
    if (seat.eventId !== eventId) {
      return {
        success: false,
        error: "Seat does not belong to the specified event",
      };
    }

    // Create reservation
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

    // Update seat status
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
    // Check for expired reservations every 10 seconds
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
