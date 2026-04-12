import { SeatService } from "../services/seatService";
import { CartService } from "../services/cartService";
import { PricingService } from "../services/pricingService";
import type { Seat } from "../models/seat";

export interface ReserveSeatResult {
  success: boolean;
  seat?: Seat;
  reservationId?: string;
  expiresAt?: Date;
  error?: string;
}

export class SeatReservationUseCase {
  private seatService: SeatService;
  private cartService: CartService;
  private pricingService: PricingService;

  constructor(
    seatService: SeatService,
    cartService: CartService,
    pricingService: PricingService,
  ) {
    this.seatService = seatService;
    this.cartService = cartService;
    this.pricingService = pricingService;
  }

  reserveSeat(seatId: string, durationMinutes: number = 15): ReserveSeatResult {
    const response = this.seatService.reserveSeat({ seatId, durationMinutes });

    if (!response.success || !response.reservation || !response.seat) {
      console.warn(`Failed to reserve seat ${seatId}: ${response.error}`);
      return { success: false, error: response.error };
    }

    const price = this.pricingService.getPrice(response.seat.category);
    this.cartService.addItem(
      response.seat,
      price,
      response.reservation.id,
      response.reservation.expiresAt,
    );

    return {
      success: true,
      seat: response.seat,
      reservationId: response.reservation.id,
      expiresAt: response.reservation.expiresAt,
    };
  }

  releaseSeat(seatId: string): void {
    const item = this.cartService.removeItem(seatId);
    if (item) {
      this.seatService.releaseReservation(item.reservationId);
    }
  }

  releaseAll(): void {
    const items = this.cartService.clear();
    items.forEach((item) => this.seatService.releaseReservation(item.reservationId));
  }

  getAllSeats(eventId?: string): Seat[] {
    return this.seatService.getAllSeats(eventId);
  }

  getSeat(seatId: string): Seat | undefined {
    return this.seatService.getSeat(seatId);
  }
}
