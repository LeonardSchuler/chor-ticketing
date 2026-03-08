import seatsMapStyles from "./SeatsMap.css?inline";

export class SeatsMap extends HTMLElement {
  private svg: SVGElement | null = null;
  private selectedSeats: Set<string> = new Set();
  private listenersAttached: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.setupGlobalEventListeners();
    // Note: SVG will be provided via init() method after component is mounted
    // Seat listeners are set up once the svg of the seats is available
  }

  disconnectedCallback() {
    this.removeSeatListeners();
    this.removeGlobalEventListeners();
  }

  private setupGlobalEventListeners() {
    // Listen for cart updates from the app
    window.addEventListener(
      "cart-updated",
      this.handleCartUpdate as EventListener,
    );
  }

  private removeGlobalEventListeners() {
    window.removeEventListener(
      "cart-updated",
      this.handleCartUpdate as EventListener,
    );
  }

  private handleCartUpdate = (event: CustomEvent) => {
    const detail = event.detail as { reservedSeatIds: string[] };
    this.updateSeatStates(detail.reservedSeatIds);
  };

  private updateSeatStates(reservedSeatIds: string[]) {
    // Update visual state to reflect what's in the cart
    const seats = this.shadowRoot?.querySelectorAll(".seat, .seat-reserved");
    seats?.forEach((seat) => {
      const seatEl = seat as HTMLElement;
      const seatNumber = seatEl.getAttribute("data-number");
      if (seatNumber && reservedSeatIds.includes(`seat-${seatNumber}`)) {
        // Change class from 'seat' to 'seat-reserved'
        seatEl.classList.remove("seat");
        seatEl.classList.add("seat-reserved");
      } else {
        // Change class from 'seat-reserved' back to 'seat'
        seatEl.classList.remove("seat-reserved");
        seatEl.classList.add("seat");
      }
    });
  }

  /**
   * Public API: Initialize the seat map with SVG layout
   * This should be called by the app after the component is mounted
   * @param svgElement - The SVG element containing the seat layout
   */
  public init(svgElement: SVGElement) {
    this.svg = svgElement.cloneNode(true) as SVGElement;
    this.render();
  }

  private attachSeatListeners() {
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    const seats = this.shadowRoot?.querySelectorAll(".seat");
    seats?.forEach((seat) => {
      const seatEl = seat as HTMLElement; // cast for TS

      // Click listener
      seatEl.addEventListener("click", this.seatClickHandler);
    });
  }

  private removeSeatListeners() {
    // Remove all seat listeners
    const seats = this.shadowRoot?.querySelectorAll(".seat");
    seats?.forEach((seat) =>
      seat.removeEventListener("click", this.seatClickHandler),
    );

    // Optional: reset the flag
    this.listenersAttached = false;
  }
  private seatClickHandler = (e: Event) => this.handleSeatClick(e);

  private handleSeatClick(e: Event) {
    const seatGroup = e.currentTarget as SVGElement;
    const seatNumber = seatGroup.getAttribute("data-number");
    if (!seatNumber) return;

    // Check if seat is already reserved (has 'seat-reserved' class)
    if (seatGroup.classList.contains("seat-reserved")) {
      // If already reserved/in cart, ignore clicks
      return;
    }

    if (this.selectedSeats.has(seatNumber)) {
      // Deselect - just visual update
      this.selectedSeats.delete(seatNumber);
      seatGroup.classList.remove("selected");

      // Emit event for app to handle
      window.dispatchEvent(
        new CustomEvent("seat-deselected", {
          detail: {
            seatNumber,
          },
        }),
      );
    } else {
      // Select seat
      this.selectedSeats.add(seatNumber);
      seatGroup.classList.add("selected");

      // Emit event for app to handle (reservation + cart addition)
      window.dispatchEvent(
        new CustomEvent("seat-selected", {
          detail: {
            seatNumber,
          },
        }),
      );
    }
  }

  private render() {
    if (!this.shadowRoot || !this.svg) return;

    // Inject styles
    const style = document.createElement("style");
    style.textContent = seatsMapStyles;
    this.shadowRoot.appendChild(style);

    // Append SVG
    this.shadowRoot.appendChild(this.svg);

    // Attach listeners after SVG exists
    this.attachSeatListeners();
  }

  // Public API
  public getSelectedSeats(): string[] {
    return Array.from(this.selectedSeats);
  }

  public clearSelection() {
    // Copy selected seats so we can dispatch events
    const previouslySelected = Array.from(this.selectedSeats);

    // Clear internal state
    this.selectedSeats.clear();

    // Remove selected CSS classes from DOM
    this.shadowRoot
      ?.querySelectorAll(".seat.selected")
      .forEach((seat) => seat.classList.remove("selected"));

    // Dispatch seat-unselected event for each previously selected seat
    previouslySelected.forEach((seatId) => {
      this.dispatchEvent(
        new CustomEvent("seat-unselected", {
          detail: {
            seatId,
            allSelected: [], // now empty
          },
          bubbles: true,
          composed: true,
        }),
      );
    });
  }
}
