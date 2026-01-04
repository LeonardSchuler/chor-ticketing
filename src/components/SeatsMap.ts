import seatsLayoutSvg from "./SeatsMap.svg?raw";
import seatsMapStyles from "./SeatsMap.css?inline";

export class SeatsMap extends HTMLElement {
  private svg: SVGElement | null = null;
  private selectedSeats: Set<string> = new Set();
  private listenersAttached: boolean = false;

  //static get observedAttributes() {
  //    return ['event-id', 'disabled-seats'];
  //}

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.loadVenueSVG();
    this.render();
  }
  disconnectedCallback() {
    this.removeSeatListeners(); // clean up click handlers
  }

  private loadVenueSVG() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(seatsLayoutSvg, "image/svg+xml");
    this.svg = doc.querySelector("svg");
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

    if (this.selectedSeats.has(seatNumber)) {
      this.selectedSeats.delete(seatNumber);
      seatGroup.classList.remove("selected");
    } else {
      this.selectedSeats.add(seatNumber);
      seatGroup.classList.add("selected");
    }

    // Emit custom event
    this.dispatchEvent(
      new CustomEvent("seat-selection-changed", {
        detail: {
          seatNumber,
          selected: this.selectedSeats.has(seatNumber),
          allSelected: Array.from(this.selectedSeats),
        },
        bubbles: true,
        composed: true,
      }),
    );
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
    this.selectedSeats.clear();
    this.shadowRoot
      ?.querySelectorAll(".seat.selected")
      .forEach((seat) => seat.classList.remove("selected"));

    // Emit event so controllers know selection cleared
    this.dispatchEvent(
      new CustomEvent("seat-selection-changed", {
        detail: { allSelected: [], selected: false },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
