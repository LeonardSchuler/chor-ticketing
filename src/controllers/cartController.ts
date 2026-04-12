import { CartService } from "../services/cartService";
import { SeatReservationUseCase } from "../application/SeatReservationUseCase";
import { OrderBookingUseCase } from "../application/orderBookingUsecase";
import type { SeatReservedEvent } from "./seatController";

export class CartController {
  private cartService: CartService;
  private reservationUseCase: SeatReservationUseCase;
  private orderBookingUseCase: OrderBookingUseCase;
  private expirationTimers: Map<string, number> = new Map();

  constructor(
    cartService: CartService,
    reservationUseCase: SeatReservationUseCase,
    orderBookingUseCase: OrderBookingUseCase,
  ) {
    this.cartService = cartService;
    this.reservationUseCase = reservationUseCase;
    this.orderBookingUseCase = orderBookingUseCase;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener("seat-reserved", ((
      event: CustomEvent<SeatReservedEvent>,
    ) => {
      this.handleSeatReserved(event.detail);
    }) as EventListener);
  }

  private handleSeatReserved(detail: SeatReservedEvent): void {
    const { seat, expiresAt } = detail;

    // Cart was already updated by the use case — just set up the expiration timer
    const msUntilExpiry = expiresAt.getTime() - Date.now();
    if (msUntilExpiry > 0) {
      const timerId = window.setTimeout(() => {
        this.handleRemoveItem(seat.id);
      }, msUntilExpiry);
      this.expirationTimers.set(seat.id, timerId);
    }

    this.broadcastCartUpdate();
  }

  handleRemoveItem(seatId: string): void {
    clearTimeout(this.expirationTimers.get(seatId));
    this.expirationTimers.delete(seatId);

    this.reservationUseCase.releaseSeat(seatId);

    this.broadcastCartUpdate();
  }

  handleUpdateDiscount(seatId: string, discountPercent: number): void {
    try {
      this.cartService.updateDiscount(seatId, discountPercent);
      this.broadcastCartUpdate();
    } catch (error) {
      console.error("Error updating discount:", error);
    }
  }

  handleClearCart(): void {
    this.expirationTimers.forEach((timerId) => clearTimeout(timerId));
    this.expirationTimers.clear();

    this.reservationUseCase.releaseAll();

    this.broadcastCartUpdate();
  }

  handlePurchase(): void {
    const result = this.orderBookingUseCase.completePurchase();

    if (!result.success) {
      console.warn("Cannot purchase:", result.error);
      return;
    }

    this.expirationTimers.forEach((timerId) => clearTimeout(timerId));
    this.expirationTimers.clear();

    alert(
      `Kauf erfolgreich!\nSitze: ${result.itemCount}\nTotal: CHF ${result.total.toFixed(2)}`,
    );

    window.dispatchEvent(
      new CustomEvent("purchase-completed", {
        detail: { purchasedSeatIds: result.purchasedSeatIds },
      }),
    );

    this.broadcastCartUpdate();
  }

  syncCartState(): void {
    this.broadcastCartUpdate();
  }

  private broadcastCartUpdate(): void {
    const summary = this.cartService.getSummary();
    const reservedSeatIds = summary.items.map((item) => item.seat.id);

    window.dispatchEvent(
      new CustomEvent("cart-updated", {
        detail: {
          summary,
          reservedSeatIds,
        },
      }),
    );
  }
}
