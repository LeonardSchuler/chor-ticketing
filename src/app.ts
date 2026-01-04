// src/app.ts
//import { SeatsController } from './controllers/SeatsController';
//import { CartController } from './controllers/CartController';
//import { SeatReservationUseCase } from './application/SeatReservationUseCase';
//import { BookingUseCase } from './application/BookingUseCase';
//import { SeatService } from './services/SeatService';
//import { CartService } from './services/CartService';
//import { PaymentService } from './services/PaymentService';
import { SeatsMap } from "./components/SeatsMap";
//import { CartPanel } from './components/CartPanel';

export class App {
  bootstrap() {
    // 1. Register Web Components
    customElements.define("seats-map", SeatsMap);
    //customElements.define('cart-panel', CartPanel);

    // 2. Initialize Services
    //const seatService = new SeatService();
    //const cartService = new CartService();
    //const paymentService = new PaymentService();

    // 3. Initialize Use Cases
    //const seatReservationUC = new SeatReservationUseCase(seatService, cartService);
    //const bookingUC = new BookingUseCase(cartService, seatService, paymentService);

    // 4. Initialize Controllers
    //const seatsController = new SeatsController(seatReservationUC);
    //const cartController = new CartController(seatReservationUC, bookingUC);

    // 5. Mount Components
    const appRoot = document.getElementById("app");
    if (!appRoot) throw new Error("App root not found");

    const seatsMapEl = document.createElement("seats-map");
    appRoot.appendChild(seatsMapEl);
    //seatsController.connect(seatsMapEl);

    //const cartPanelEl = document.createElement('chor-cart-panel');
    //appRoot.appendChild(cartPanelEl);
    //cartController.connect(cartPanelEl);

    // 6. Restore persisted cart
    //cartService.restoreFromStorage();
  }
}
