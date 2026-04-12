import type { CartSummary } from "../models/cartItem";
import { escapeHtml } from "../utils/html";
import "./CartPanel.css";

export class CartPanel extends HTMLElement {
  private cartSummary: CartSummary = {
    items: [],
    subtotal: 0,
    totalDiscount: 0,
    total: 0,
    itemCount: 0,
  };
  private timerInterval: number | undefined;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.setupGlobalEventListeners();
  }

  disconnectedCallback() {
    clearInterval(this.timerInterval);
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
    const detail = event.detail as { summary: CartSummary };
    this.cartSummary = detail.summary;
    this.render();
  };

  private setupEventListeners() {
    this.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      // Handle remove button
      if (target.classList.contains("remove-btn")) {
        const seatId = target.dataset.seatId;
        if (seatId) {
          window.dispatchEvent(
            new CustomEvent("cart-item-remove", {
              detail: { seatId },
            }),
          );
        }
      }

      // Handle clear cart button
      if (target.classList.contains("clear-btn")) {
        if (confirm("Möchten Sie den Warenkorb wirklich leeren?")) {
          window.dispatchEvent(new CustomEvent("cart-clear"));
        }
      }

      // Handle purchase button
      if (target.classList.contains("purchase-btn")) {
        window.dispatchEvent(new CustomEvent("cart-purchase"));
      }
    });

    // Handle discount input changes
    this.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.classList.contains("discount-input")) {
        const seatId = target.dataset.seatId;
        const discount = parseFloat(target.value) || 0;
        if (seatId) {
          window.dispatchEvent(
            new CustomEvent("cart-item-discount-update", {
              detail: { seatId, discount },
            }),
          );
        }
      }
    });
  }

  private render() {
    const summary = this.cartSummary;

    this.innerHTML = `
      <div class="cart-panel">
        <h2 class="cart-title">Warenkorb</h2>

        ${this.renderCartItems(summary)}

        <div class="cart-summary">
          <div class="summary-row">
            <span>Zwischensumme:</span>
            <span>CHF ${summary.subtotal.toFixed(2)}</span>
          </div>
          ${
            summary.totalDiscount > 0
              ? `
          <div class="summary-row discount">
            <span>Rabatt:</span>
            <span>- CHF ${summary.totalDiscount.toFixed(2)}</span>
          </div>
          `
              : ""
          }
          <div class="summary-row total">
            <span>Total:</span>
            <span>CHF ${summary.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="cart-actions">
          <button class="clear-btn" ${summary.itemCount === 0 ? "disabled" : ""}>
            Leeren
          </button>
          <button class="purchase-btn" ${summary.itemCount === 0 ? "disabled" : ""}>
            Kaufen
          </button>
        </div>
      </div>
    `;

    // Setup timers for each item
    this.setupTimers(summary);
  }

  private renderCartItems(summary: CartSummary): string {
    if (summary.itemCount === 0) {
      return '<div class="empty-cart">Ihr Warenkorb ist leer</div>';
    }

    return `
      <div class="cart-items">
        ${summary.items
          .map(
            (item) => {
              // Escape seat ID once for reuse (defense against XSS)
              const safeSeatId = escapeHtml(item.seat.id);
              return `
          <div class="cart-item" data-seat-id="${safeSeatId}">
            <div class="item-header">
              <span class="seat-label">Sitz: ${safeSeatId}</span>
              <button class="remove-btn" data-seat-id="${safeSeatId}">✕</button>
            </div>

            <div class="item-details">
              <div class="item-row">
                <span class="label">Preis:</span>
                <span>CHF ${item.price.toFixed(2)}</span>
              </div>

              <div class="item-row">
                <label class="label" for="discount-${safeSeatId}">Rabatt (%):</label>
                <input
                  type="number"
                  id="discount-${safeSeatId}"
                  class="discount-input"
                  data-seat-id="${safeSeatId}"
                  value="${item.discount}"
                  min="0"
                  max="100"
                  step="5"
                />
              </div>

              ${
                item.discount > 0
                  ? `
              <div class="item-row final-price">
                <span class="label">Endpreis:</span>
                <span>CHF ${(item.price * (1 - item.discount / 100)).toFixed(2)}</span>
              </div>
              `
                  : ""
              }
            </div>

            <div class="item-timer" data-seat-id="${safeSeatId}">
              <span class="timer-label">Läuft ab in:</span>
              <span class="timer-value" id="timer-${safeSeatId}">--:--</span>
            </div>
          </div>
        `;
            },
          )
          .join("")}
      </div>
    `;
  }

  private setupTimers(summary: CartSummary) {
    clearInterval(this.timerInterval);

    if (summary.items.length === 0) return;

    const updateAllTimers = () => {
      const now = Date.now();
      summary.items.forEach((item) => {
        const timerElement = this.querySelector(
          `#timer-${item.seat.id}`,
        ) as HTMLElement;
        if (!timerElement) return;

        const timeLeft = item.expiresAt.getTime() - now;
        if (timeLeft <= 0) {
          timerElement.textContent = "Abgelaufen";
          timerElement.classList.add("expired");
        } else {
          const minutes = Math.floor(timeLeft / 60000);
          const seconds = Math.floor((timeLeft % 60000) / 1000);
          timerElement.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
          if (timeLeft < 120000) {
            timerElement.classList.add("warning");
          }
        }
      });
    };

    updateAllTimers();
    this.timerInterval = window.setInterval(updateAllTimers, 1000);
  }
}