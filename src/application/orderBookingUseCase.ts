import { CartService } from "../services/cartService";
import { SeatService } from "../services/seatService";

export interface PurchaseResult {
  success: boolean;
  purchasedSeatIds: string[];
  total: number;
  itemCount: number;
  error?: string;
}

export class OrderBookingUseCase {
  private cartService: CartService;
  private seatService: SeatService;

  constructor(cartService: CartService, seatService: SeatService) {
    this.cartService = cartService;
    this.seatService = seatService;
  }

  async completePurchase(): Promise<PurchaseResult> {
    const summary = this.cartService.getSummary();

    if (summary.itemCount === 0) {
      return { success: false, purchasedSeatIds: [], total: 0, itemCount: 0, error: "Cart is empty" };
    }

    const booking = await this.seatService.confirmBooking(
      summary.items.map((item) => item.reservationId),
    );
    if (!booking.success) {
      return { success: false, purchasedSeatIds: [], total: 0, itemCount: 0, error: booking.error };
    }

    const purchasedSeatIds = summary.items.map((item) => item.seat.id);
    const { total, itemCount } = summary;

    this.cartService.clear();

    return { success: true, purchasedSeatIds, total, itemCount };
  }
}
