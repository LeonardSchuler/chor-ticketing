import { CartService } from "../services/cartService";

export interface PurchaseResult {
  success: boolean;
  purchasedSeatIds: string[];
  total: number;
  itemCount: number;
  error?: string;
}

export class OrderBookingUseCase {
  private cartService: CartService;

  constructor(cartService: CartService) {
    this.cartService = cartService;
  }

  completePurchase(): PurchaseResult {
    const summary = this.cartService.getSummary();

    if (summary.itemCount === 0) {
      return { success: false, purchasedSeatIds: [], total: 0, itemCount: 0, error: "Cart is empty" };
    }

    const purchasedSeatIds = summary.items.map((item) => item.seat.id);
    const { total, itemCount } = summary;

    this.cartService.clear();

    return { success: true, purchasedSeatIds, total, itemCount };
  }
}
