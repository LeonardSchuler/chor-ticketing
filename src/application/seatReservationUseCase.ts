import { SeatService } from "../services/seatService";
import { CartService } from "../services/cartService";
import { PricingService } from "../services/pricingService";
import type { Seat } from "../models/seat";
import type { Reservation } from "../models/reservation";

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

  async reserveSeat(
    seatId: string,
    durationMinutes: number = 10,
  ): Promise<ReserveSeatResult> {
    const response = await this.seatService.reserveSeat({ seatId, durationMinutes });

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

  /**
   * Rebuild the cart persisted by an earlier page load. Only items whose
   * reservation is still active on the backend are restored.
   */
  restoreCart(activeReservations: Reservation[]): void {
    const active = new Map(activeReservations.map((r) => [r.id, r]));

    this.cartService.loadStored().forEach((stored) => {
      const reservation = active.get(stored.reservationId);
      const seat = this.seatService.getSeat(stored.seatId);
      if (!reservation || !seat || reservation.seatId !== seat.id) return;

      this.seatService.restoreReservation(reservation);
      this.cartService.addItem(
        seat,
        this.pricingService.getPrice(seat.category),
        reservation.id,
        reservation.expiresAt,
      );
      if (stored.discount >= 0 && stored.discount <= 100) {
        this.cartService.updateDiscount(seat.id, stored.discount);
      }
    });

    // Drop stale entries (expired or released) from storage
    this.cartService.persist();
  }

  async releaseSeat(seatId: string): Promise<void> {
    const item = this.cartService.removeItem(seatId);
    if (item) {
      await this.seatService.releaseReservation(item.reservationId);
    }
  }

  async releaseAll(): Promise<void> {
    const items = this.cartService.clear();
    await Promise.all(items.map((item) => this.seatService.releaseReservation(item.reservationId)));
  }

  getAllSeats(eventId?: string): Seat[] {
    return this.seatService.getAllSeats(eventId);
  }

  getSeat(seatId: string): Seat | undefined {
    return this.seatService.getSeat(seatId);
  }
}
