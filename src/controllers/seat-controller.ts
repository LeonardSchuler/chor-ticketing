import { SeatReservationUseCase } from "../application/SeatReservationUseCase";
import { SeatService } from "../services/seat-service";
import type { Seat } from "../models/seat";

export interface SeatReservedEvent {
  seat: Seat;
  reservationId: string;
  expiresAt: Date;
}

export class SeatController extends EventTarget {
  private reservationUseCase: SeatReservationUseCase;
  private seatService: SeatService;

  constructor(
    reservationUseCase: SeatReservationUseCase,
    seatService: SeatService,
  ) {
    super();
    this.reservationUseCase = reservationUseCase;
    this.seatService = seatService;
  }

  handleSeatSelection(seatNumber: string, eventId: string): void {
    // Format seat ID to match storage format (seat-{number})
    const seatId = `seat-${seatNumber}`;

    try {
      const response = this.reservationUseCase.execute({
        seatId,
        eventId,
        durationMinutes: 15,
      });

      if (response.success && response.reservation && response.seat) {
        // Emit seat-reserved event
        const event = new CustomEvent<SeatReservedEvent>("seat-reserved", {
          detail: {
            seat: response.seat,
            reservationId: response.reservation.id,
            expiresAt: response.reservation.expiresAt,
          },
        });
        this.dispatchEvent(event);
      } else {
        // Emit error event
        const errorEvent = new CustomEvent("seat-reservation-failed", {
          detail: {
            seatId,
            error: response.error || "Unknown error",
          },
        });
        this.dispatchEvent(errorEvent);
      }
    } catch (error) {
      console.error("Error reserving seat:", error);
      const errorEvent = new CustomEvent("seat-reservation-failed", {
        detail: {
          seatId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
      this.dispatchEvent(errorEvent);
    }
  }

  handleSeatDeselection(seatId: string, reservationId: string): void {
    try {
      const success = this.reservationUseCase.releaseReservation(reservationId);

      if (success) {
        const event = new CustomEvent("seat-released", {
          detail: { seatId, reservationId },
        });
        this.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Error releasing seat:", error);
    }
  }

  getAllSeats(eventId?: string): Seat[] {
    return this.seatService.getAllSeats(eventId);
  }

  getSeat(seatId: string): Seat | undefined {
    return this.seatService.getSeat(seatId);
  }
}
