import { SeatService } from "../services/seat-service";
import type {
  ReservationRequest,
  ReservationResponse,
} from "../models/reservation";
import type { Seat } from "../models/seat";

export class SeatReservationUseCase {
  private seatService: SeatService;

  constructor(seatService: SeatService) {
    this.seatService = seatService;
  }

  execute(request: ReservationRequest): ReservationResponse {
    // Business logic: validate and reserve seat
    const response = this.seatService.reserveSeat(request);

    if (!response.success) {
      console.warn(
        `Failed to reserve seat ${request.seatId}: ${response.error}`,
      );
    }

    return response;
  }

  releaseReservation(reservationId: string): boolean {
    return this.seatService.releaseReservation(reservationId);
  }

  getAllSeats(eventId?: string): Seat[] {
    return this.seatService.getAllSeats(eventId);
  }

  getSeat(seatId: string): Seat | undefined {
    return this.seatService.getSeat(seatId);
  }
}
