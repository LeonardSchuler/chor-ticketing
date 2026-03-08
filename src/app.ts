// src/app.ts
import { SeatController } from "./controllers/seat-controller";
import { CartController } from "./controllers/cart-controller";
import { SeatReservationUseCase } from "./application/SeatReservationUseCase";
import { SeatService } from "./services/seat-service";
import { CartService } from "./services/cart-service";
import { PricingService } from "./services/pricing-service";
import { SvgSeatLayoutAdapter } from "./infrastructure/svg-seat-layout-adapter";
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

    // 2. Initialize Services
    const seatService = new SeatService();
    const cartService = new CartService();
    const pricingService = new PricingService();
    pricingService.init(); // Initialize pricing data

    // 3. Load seat layout from SVG using adapter
    const eventId = "event-1";
    const seatLayoutAdapter = new SvgSeatLayoutAdapter();
    const { seats: seatLayout, svgElement } = await seatLayoutAdapter.load(
      "/seats-layout.svg",
    );

    // 4. Initialize seats in domain service
    seatService.initializeSeats(seatLayout, eventId);

    // 5. Initialize Use Cases
    const seatReservationUC = new SeatReservationUseCase(seatService);

    // 6. Initialize Controllers
    const seatController = new SeatController(seatReservationUC);
    const cartController = new CartController(
      cartService,
      pricingService,
      seatController,
      seatReservationUC,
    );

    // 7. Mount Components
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

    // 7.5. Initialize SeatsMap component with SVG layout
    const seatsMapElement = appRoot.querySelector("seats-map") as SeatsMap;
    if (seatsMapElement) {
      seatsMapElement.init(svgElement);
    }

    // 8. Wire up global event listeners
    this.setupEventListeners(seatController, cartController, eventId);

    // 9. Initial cart update to sync UI
    cartController.syncCartState();

    console.log("✅ App initialized successfully");
    console.log(`📍 Event ID: ${eventId}`);
    console.log(
      `🪑 Seats available: ${seatService.getAllSeats(eventId).length}`,
    );
  }

  private setupEventListeners(
    seatController: SeatController,
    cartController: CartController,
    eventId: string,
  ) {
    // Listen to seat selection events from SeatsMap
    window.addEventListener("seat-selected", ((event: CustomEvent) => {
      const detail = event.detail as { seatNumber: string };
      seatController.handleSeatSelection(detail.seatNumber, eventId);
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
