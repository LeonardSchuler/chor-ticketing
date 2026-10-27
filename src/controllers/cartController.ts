import { CartService } from '../services/cartService';
import { SeatReservationUseCase } from '../application/seatReservationUseCase';
import { OrderBookingUseCase } from '../application/orderBookingUseCase';
import type { SeatReservedEvent } from './seatController';

export class CartController {
  private cartService: CartService;
  private reservationUseCase: SeatReservationUseCase;
  private orderBookingUseCase: OrderBookingUseCase;
  private expirationTimers: Map<string, number> = new Map();

  constructor(
    cartService: CartService,
    reservationUseCase: SeatReservationUseCase,
    orderBookingUseCase: OrderBookingUseCase
  ) {
    this.cartService = cartService;
    this.reservationUseCase = reservationUseCase;
    this.orderBookingUseCase = orderBookingUseCase;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('seat-reserved', ((event: CustomEvent<SeatReservedEvent>) => {
      this.handleSeatReserved(event.detail);
    }) as EventListener);
  }

  private handleSeatReserved(detail: SeatReservedEvent): void {
    // Cart was already updated by the use case — just set up the expiration timer
    this.scheduleExpiration(detail.seat.id, detail.expiresAt);
    this.broadcastCartUpdate();
  }

  private scheduleExpiration(seatId: string, expiresAt: Date): void {
    if (this.expirationTimers.has(seatId)) return;

    const msUntilExpiry = expiresAt.getTime() - Date.now();
    if (msUntilExpiry > 0) {
      const timerId = window.setTimeout(() => {
        void this.handleRemoveItem(seatId);
      }, msUntilExpiry);
      this.expirationTimers.set(seatId, timerId);
    }
  }

  async handleRemoveItem(seatId: string): Promise<void> {
    clearTimeout(this.expirationTimers.get(seatId));
    this.expirationTimers.delete(seatId);

    // Cart is updated synchronously inside releaseSeat; only the backend call is awaited
    const released = this.reservationUseCase.releaseSeat(seatId);
    this.broadcastCartUpdate();
    await released;
  }

  handleUpdateDiscount(seatId: string, discountPercent: number): void {
    try {
      this.cartService.updateDiscount(seatId, discountPercent);
      this.broadcastCartUpdate();
    } catch (error) {
      console.error('Error updating discount:', error);
    }
  }

  async handleClearCart(): Promise<void> {
    this.expirationTimers.forEach((timerId) => clearTimeout(timerId));
    this.expirationTimers.clear();

    const released = this.reservationUseCase.releaseAll();
    this.broadcastCartUpdate();
    await released;
  }

  async handlePurchase(): Promise<void> {
    const result = await this.orderBookingUseCase.completePurchase();

    if (!result.success) {
      console.warn('Cannot purchase:', result.error);
      alert(`Kauf fehlgeschlagen: ${result.error}`);
      return;
    }

    this.expirationTimers.forEach((timerId) => clearTimeout(timerId));
    this.expirationTimers.clear();

    alert(`Kauf erfolgreich!\nSitze: ${result.itemCount}\nTotal: CHF ${result.total.toFixed(2)}`);

    window.dispatchEvent(
      new CustomEvent('purchase-completed', {
        detail: { purchasedSeatIds: result.purchasedSeatIds },
      })
    );

    this.broadcastCartUpdate();
  }

  syncCartState(): void {
    // Items restored from storage have no expiration timer yet
    this.cartService
      .getAllItems()
      .forEach((item) => this.scheduleExpiration(item.seat.id, item.expiresAt));
    this.broadcastCartUpdate();
  }

  private broadcastCartUpdate(): void {
    const summary = this.cartService.getSummary();
    const reservedSeatIds = summary.items.map((item) => item.seat.id);

    window.dispatchEvent(
      new CustomEvent('cart-updated', {
        detail: {
          summary,
          reservedSeatIds,
        },
      })
    );
  }
}
