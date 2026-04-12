// src/app.ts
import { SeatController } from "./controllers/seatController";
import { CartController } from "./controllers/cartController";
import { SeatReservationUseCase } from "./application/SeatReservationUseCase";
import { OrderBookingUseCase } from "./application/orderBookingUsecase";
import { SeatService } from "./services/seatService";
import { CartService } from "./services/cartService";
import { PricingService } from "./services/pricingService";
import { EventContextService } from "./services/eventContextService";
import { EventApiService } from "./services/eventApiService";
import { SvgSeatLayoutAdapter } from "./infrastructure/svgSeatLayoutAdapter";
import { SeatsMap } from "./components/SeatsMap";
import { CartPanel } from "./components/CartPanel";

export class App {
  async bootstrap() {
    // 1. Register Web Components
    if (!customElements.get("seats-map")) {
      customElements.define("seats-map", SeatsMap);
    }
    if (!customElements.get("cart-panel")) {
      customElements.define("cart-panel", CartPanel);
    }

    // 2. Initialize Event Context and API Services
    const eventApiService = new EventApiService();
    const eventContextService = new EventContextService(eventApiService);

    // 3. Initialize and load the event (handles URL params, localStorage, and defaults)
    const event = await eventContextService.initializeEvent();

    console.log(`📅 Loaded event: ${event.title}`);
    console.log(`📍 Venue: ${event.venue}`);
    console.log(`📆 Date: ${event.date}`);

    // 4. Initialize Services with EventContext
    const seatService = new SeatService(eventContextService);
    const cartService = new CartService();
    const pricingService = new PricingService();
    pricingService.init(); // Initialize pricing data

    // 5. Load seat layout from SVG using adapter
    const seatLayoutAdapter = new SvgSeatLayoutAdapter();
    const { seats: seatLayout, svgElement } = await seatLayoutAdapter.load(
      event.seatLayoutUrl,
    );

    // 6. Initialize seats in domain service (uses current event from context)
    seatService.initializeSeats(seatLayout);

    // 7. Initialize Use Cases
    const seatReservationUC = new SeatReservationUseCase(seatService, cartService, pricingService);
    const orderBookingUC = new OrderBookingUseCase(cartService);

    // 8. Initialize Controllers
    const seatController = new SeatController(seatReservationUC);
    const cartController = new CartController(
      cartService,
      seatReservationUC,
      orderBookingUC,
    );

    // 9. Mount Components
    const appRoot = document.getElementById("app");
    if (!appRoot) throw new Error("App root not found");

    appRoot.innerHTML = `
<div class="flex flex-col lg:flex-row gap-4 lg:gap-8 p-4 lg:p-8 max-w-7xl mx-auto">
  <div class="flex-1">
    <h1 class="mb-4 text-2xl font-bold">Sitzplatzauswahl</h1>
    <seats-map></seats-map>
  </div>
  <div class="w-full lg:w-96">
    <cart-panel></cart-panel>
  </div>
</div>
    `;

    // 10. Initialize SeatsMap component with SVG layout
    const seatsMapElement = appRoot.querySelector("seats-map") as SeatsMap;
    if (seatsMapElement) {
      seatsMapElement.init(svgElement);
    }

    // 11. Wire up global event listeners
    this.setupEventListeners(seatController, cartController);

    // 12. Initial cart update to sync UI
    cartController.syncCartState();

    console.log("✅ App initialized successfully");
    console.log(`📍 Event: ${event.title} (${event.id})`);
    console.log(
      `🪑 Seats available: ${seatService.getAllSeats().length}`,
    );
  }

  private setupEventListeners(
    seatController: SeatController,
    cartController: CartController,
  ) {
    // Listen to seat selection events from SeatsMap
    window.addEventListener("seat-selected", ((event: CustomEvent) => {
      const detail = event.detail as { seatNumber: string };
      seatController.handleSeatSelection(detail.seatNumber);
    }) as EventListener);

    // Listen to cart events from CartPanel
    window.addEventListener("cart-item-remove", ((event: CustomEvent) => {
      const detail = event.detail as { seatId: string };
      cartController.handleRemoveItem(detail.seatId);
    }) as EventListener);

    window.addEventListener("cart-clear", () => {
      cartController.handleClearCart();
    });

    window.addEventListener("cart-purchase", () => {
      cartController.handlePurchase();
    });

    window.addEventListener("cart-item-discount-update", ((
      event: CustomEvent,
    ) => {
      const detail = event.detail as { seatId: string; discount: number };
      cartController.handleUpdateDiscount(detail.seatId, detail.discount);
    }) as EventListener);
  }
}
