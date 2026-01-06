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
  }

  handleRemoveItem(seatId: string): void {
    const item = this.cartService.removeItem(seatId);

    if (item) {
      // Release the reservation
      this.reservationUseCase.releaseReservation(item.reservationId);
    }
  }

  handleUpdateDiscount(seatId: string, discountPercent: number): void {
    try {
      this.cartService.updateDiscount(seatId, discountPercent);
    } catch (error) {
      console.error("Error updating discount:", error);
    }
  }

  handleClearCart(): void {
    const items = this.cartService.clear();

    // Release all reservations
    items.forEach((item) => {
      this.reservationUseCase.releaseReservation(item.reservationId);
    });
  }

  handlePurchase(): void {
    const summary = this.cartService.getSummary();

    if (summary.itemCount === 0) {
      console.warn("Cannot purchase: cart is empty");
      return;
    }

    // TODO: Implement payment processing with Stripe
    console.log("Processing purchase:", summary);

    // For now, just clear the cart after "successful" purchase
    // In production, this would wait for payment confirmation
    alert(
      `Kauf erfolgreich!\nSitze: ${summary.itemCount}\nTotal: CHF ${summary.total.toFixed(2)}`,
    );

    this.cartService.clear();
  }
}
