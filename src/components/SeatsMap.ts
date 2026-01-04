import seatsLayoutUrl from "./SeatsMap.svg";
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

  async connectedCallback() {
    console.log("Venue component connected");
    await this.loadVenueSVG();
    console.log("SVG loaded:", this.svg);
    this.render();
    this.attachSeatListeners();
  }

  private async loadVenueSVG() {
    console.log("Fetching SVG from:", seatsLayoutUrl);
    const response = await fetch(seatsLayoutUrl);
    console.log("Response status:", response.status);
    const svgText = await response.text();
    console.log("SVG text length:", svgText.length);
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    this.svg = doc.querySelector("svg");
    console.log("Parsed SVG:", this.svg);
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
