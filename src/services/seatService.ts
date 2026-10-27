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

  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = "/api") {
    this.apiBaseUrl = apiBaseUrl;
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
   * Mark seats as permanently booked (e.g. from the backend bookings list).
   */
  markBooked(seatIds: string[]): void {
    seatIds.forEach((id) => this.bookSeat(id));
  }

  /**
   * Mark free seats as reserved (e.g. held by other users, from the backend).
   */
  markReserved(seatIds: string[]): void {
    seatIds.forEach((id) => {
      const seat = this.seats.get(id);
      if (seat && seat.status === SeatStatus.FREE) seat.status = SeatStatus.RESERVED;
    });
  }

  /**
   * Re-register a reservation made by this client in an earlier page load.
   */
  restoreReservation(reservation: Reservation): void {
    const seat = this.seats.get(reservation.seatId);
    if (!seat) return;
    seat.status = SeatStatus.RESERVED;
    this.reservations.set(reservation.id, reservation);
  }

  /**
   * Reserve a seat for the current event via the backend.
   * @param request - Reservation request with seatId and optional eventId
   */
  async reserveSeat(request: ReservationRequest): Promise<ReservationResponse> {
    const seat = this.seats.get(request.seatId);

    if (!seat) {
      return { success: false, error: "Seat not found" };
    }

    if (seat.status !== SeatStatus.FREE) {
      return { success: false, error: "Seat is not available" };
    }

    const eventId = request.eventId ?? this.currentEventId;

    if (seat.eventId !== eventId) {
      return {
        success: false,
        error: "Seat does not belong to the specified event",
      };
    }

    let response: Response;
    try {
      response = await fetch(`${this.apiBaseUrl}/events/${eventId}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatId: Number(seat.number),
          durationMinutes: request.durationMinutes || 15,
        }),
      });
    } catch {
      return { success: false, error: "Backend not reachable" };
    }

    if (!response.ok) {
      if (response.status === 409) {
        // Held or booked by someone else
        seat.status = SeatStatus.BOOKED;
        return { success: false, error: "Seat is not available" };
      }
      return { success: false, error: `Reservation failed (${response.status})` };
    }

    const data = (await response.json()) as {
      id: string;
      seatId: number;
      createdAt: string;
      expiresAt: string;
    };
    const reservation: Reservation = {
      id: data.id,
      seatId: `seat-${data.seatId}`,
      eventId,
      createdAt: new Date(data.createdAt),
      expiresAt: new Date(data.expiresAt),
    };

    seat.status = SeatStatus.RESERVED;
    this.reservations.set(reservation.id, reservation);

    return { success: true, reservation, seat };
  }

  async releaseReservation(reservationId: string): Promise<boolean> {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      return false;
    }

    const seat = this.seats.get(reservation.seatId);
    if (seat && seat.status === SeatStatus.RESERVED) {
      seat.status = SeatStatus.FREE;
    }
    this.reservations.delete(reservationId);

    try {
      await fetch(
        `${this.apiBaseUrl}/events/${reservation.eventId}/reservations/${reservationId}`,
        { method: "DELETE" },
      );
    } catch {
      // Backend purges expired reservations itself; local state is already released
    }
    return true;
  }

  /**
   * Turn active reservations into permanent bookings via the backend.
   * All-or-nothing: fails if any reservation is unknown or has expired.
   */
  async confirmBooking(
    reservationIds: string[],
  ): Promise<{ success: boolean; error?: string }> {
    const first = this.reservations.get(reservationIds[0]);
    if (!first) {
      return { success: false, error: "Reservation not found" };
    }

    let response: Response;
    try {
      response = await fetch(`${this.apiBaseUrl}/events/${first.eventId}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationIds }),
      });
    } catch {
      return { success: false, error: "Backend not reachable" };
    }

    if (!response.ok) {
      return response.status === 409
        ? { success: false, error: "Reservation expired" }
        : { success: false, error: `Booking failed (${response.status})` };
    }

    reservationIds.forEach((id) => {
      const reservation = this.reservations.get(id);
      if (reservation) this.bookSeat(reservation.seatId);
      this.reservations.delete(id);
    });
    return { success: true };
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
      void this.releaseReservation(reservationId);
    });
  }

  stopCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
  }

  private bookSeat(seatId: string): boolean {
    const seat = this.seats.get(seatId);
    if (!seat) return false;

    seat.status = SeatStatus.BOOKED;
    this.seats.set(seat.id, seat);
    return true;
  }
}
