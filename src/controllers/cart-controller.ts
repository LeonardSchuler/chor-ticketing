import { CartService } from "../services/cart-service";
import { PricingService } from "../services/pricing-service";
import { SeatController } from "./seat-controller";
import type { SeatReservedEvent } from "./seat-controller";
import { SeatReservationUseCase } from "../application/SeatReservationUseCase";

export class CartController {
  private cartService: CartService;
  private pricingService: PricingService;
  private seatController: SeatController;
  private reservationUseCase: SeatReservationUseCase;
  private expirationTimers: Map<string, number> = new Map();

  constructor(
    cartService: CartService,
    pricingService: PricingService,
    seatController: SeatController,
    reservationUseCase: SeatReservationUseCase,
  ) {
    this.cartService = cartService;
    this.pricingService = pricingService;
    this.seatController = seatController;
    this.reservationUseCase = reservationUseCase;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for successful seat reservations from SeatController
    this.seatController.addEventListener("seat-reserved", ((
      event: CustomEvent<SeatReservedEvent>,
    ) => {
      this.handleSeatReserved(event.detail);
    }) as EventListener);
  }

  private handleSeatReserved(detail: SeatReservedEvent): void {
    const { seat, reservationId, expiresAt } = detail;

    // Get price from pricing service
    const price = this.pricingService.getPrice(seat.category);

    // Add to cart
    this.cartService.addItem(seat, price, reservationId, expiresAt);

    // Schedule expiration so the UI updates when the reservation runs out
    const msUntilExpiry = expiresAt.getTime() - Date.now();
    if (msUntilExpiry > 0) {
      const timerId = window.setTimeout(() => {
        this.handleRemoveItem(seat.id);
      }, msUntilExpiry);
      this.expirationTimers.set(seat.id, timerId);
    }

    // Broadcast cart update
    this.broadcastCartUpdate();
  }

  handleRemoveItem(seatId: string): void {
    clearTimeout(this.expirationTimers.get(seatId));
    this.expirationTimers.delete(seatId);

    const item = this.cartService.removeItem(seatId);

    if (item) {
      // Release the reservation
      this.reservationUseCase.releaseReservation(item.reservationId);
    }

    // Broadcast cart update
    this.broadcastCartUpdate();
  }

  handleUpdateDiscount(seatId: string, discountPercent: number): void {
    try {
      this.cartService.updateDiscount(seatId, discountPercent);
      // Broadcast cart update
      this.broadcastCartUpdate();
    } catch (error) {
      console.error("Error updating discount:", error);
    }
  }

  handleClearCart(): void {
    this.expirationTimers.forEach((timerId) => clearTimeout(timerId));
    this.expirationTimers.clear();

    const items = this.cartService.clear();

    // Release all reservations
    items.forEach((item) => {
      this.reservationUseCase.releaseReservation(item.reservationId);
    });

    // Broadcast cart update
    this.broadcastCartUpdate();
  }

  handlePurchase(): void {
    const summary = this.cartService.getSummary();

    if (summary.itemCount === 0) {
      console.warn("Cannot purchase: cart is empty");
      return;
    }

    // TODO: Implement payment processing with Stripe
    console.log("Processing purchase:", summary);

    // Capture seat IDs before clearing
    const purchasedSeatIds = summary.items.map((item) => item.seat.id);

    // For now, just clear the cart after "successful" purchase
    // In production, this would wait for payment confirmation
    alert(
      `Kauf erfolgreich!\nSitze: ${summary.itemCount}\nTotal: CHF ${summary.total.toFixed(2)}`,
    );

    this.expirationTimers.forEach((timerId) => clearTimeout(timerId));
    this.expirationTimers.clear();
    this.cartService.clear();

    // Notify about completed purchase so SeatsMap can mark seats as booked
    window.dispatchEvent(
      new CustomEvent("purchase-completed", {
        detail: { purchasedSeatIds },
      }),
    );

    // Broadcast cart update
    this.broadcastCartUpdate();
  }

  syncCartState(): void {
    // Public method for initial cart state sync
    this.broadcastCartUpdate();
  }

  private broadcastCartUpdate(): void {
    const summary = this.cartService.getSummary();
    const reservedSeatIds = summary.items.map((item) => item.seat.id);

    // Notify all components about cart update
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
