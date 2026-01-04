import seatsLayoutSvg from "./SeatsMap.svg?raw";
import seatsMapStyles from "./SeatsMap.css?inline";

class SeatsMap extends HTMLElement {
  private svg: SVGElement | null = null;
  private selectedSeats: Set<string> = new Set();

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
    this.attachSeatListeners();
  }

  private loadVenueSVG() {
    const parser = new DOMParser();
    const doc = parser.parseFromString(seatsLayoutSvg, "image/svg+xml");
    this.svg = doc.querySelector("svg");
  }

  private attachSeatListeners() {
    const seats = this.shadowRoot?.querySelectorAll(".seat");
    seats?.forEach((seat) => {
      seat.addEventListener("click", (e) => this.handleSeatClick(e));
    });
  }

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

    // Inject styles into Shadow DOM
    const style = document.createElement("style");
    style.textContent = seatsMapStyles;
    this.shadowRoot.appendChild(style);

    this.shadowRoot.appendChild(this.svg);
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
  }
}

// Register the component
customElements.define("seats-map", SeatsMap);
