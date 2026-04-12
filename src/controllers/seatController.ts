import { SeatReservationUseCase } from "../application/SeatReservationUseCase";
import type { Seat } from "../models/seat";

export interface SeatReservedEvent {
  seat: Seat;
  reservationId: string;
  expiresAt: Date;
}

export class SeatController {
  private reservationUseCase: SeatReservationUseCase;

  constructor(reservationUseCase: SeatReservationUseCase) {
    this.reservationUseCase = reservationUseCase;
  }

  handleSeatSelection(seatNumber: string): void {
    const seatId = `seat-${seatNumber}`;

    const result = this.reservationUseCase.reserveSeat(seatId);

    if (result.success && result.seat && result.reservationId && result.expiresAt) {
      window.dispatchEvent(
        new CustomEvent<SeatReservedEvent>("seat-reserved", {
          detail: {
            seat: result.seat,
            reservationId: result.reservationId,
            expiresAt: result.expiresAt,
          },
        }),
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("seat-reservation-failed", {
          detail: {
            seatId,
            error: result.error || "Unknown error",
          },
        }),
      );
    }
  }

  getAllSeats(eventId?: string): Seat[] {
    return this.reservationUseCase.getAllSeats(eventId);
  }

  getSeat(seatId: string): Seat | undefined {
    return this.reservationUseCase.getSeat(seatId);
  }
}
