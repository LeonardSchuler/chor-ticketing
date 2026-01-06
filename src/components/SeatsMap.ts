import seatsMapStyles from "./SeatsMap.css?inline";

export class SeatsMap extends HTMLElement {
  private svg: SVGElement | null = null;
  private selectedSeats: Set<string> = new Set();
  private listenersAttached: boolean = false;
  private svgPath: string = "/seats-layout.svg"; // Path to SVG in public folder

  static get observedAttributes() {
    return ["event-id"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    await this.loadVenueSVG();
    this.render();
    this.setupGlobalEventListeners();
  }

  disconnectedCallback() {
    this.removeSeatListeners();
    this.removeGlobalEventListeners();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "event-id" && oldValue !== newValue) {
      // Event ID changed, could trigger re-render if needed
    }
  }

  private get eventId(): string {
    return this.getAttribute("event-id") || "event-1";
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
    const seats = this.shadowRoot?.querySelectorAll(".seat");
    seats?.forEach((seat) => {
      const seatEl = seat as HTMLElement;
      const seatNumber = seatEl.getAttribute("data-number");
      if (seatNumber && reservedSeatIds.includes(`seat-${seatNumber}`)) {
        seatEl.classList.add("reserved");
      } else {
        seatEl.classList.remove("reserved");
      }
    });
  }

  private async loadVenueSVG() {
    try {
      const response = await fetch(this.svgPath);
      const svgText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, "image/svg+xml");
      this.svg = doc.querySelector("svg");
    } catch (error) {
      console.error("Failed to load venue SVG:", error);
      throw error;
    }
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

    // Check if seat is already reserved (has 'reserved' class)
    if (seatGroup.classList.contains("reserved")) {
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
            eventId: this.eventId,
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
            eventId: this.eventId,
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
