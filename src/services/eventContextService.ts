// src/services/event-context-service.ts
import type { Event, EventChangedDetail } from "../models/event";

/**
 * Service for managing the current event context.
 * Acts as the central source of truth for which event
 * the user is currently viewing/booking seats for.
 *
 * Holds in-memory state and notifies listeners of changes.
 * Event selection and loading logic lives in EventSelectionUseCase.
 */
export class EventContextService {
  private currentEvent: Event | null = null;

  /**
   * Set the current active event.
   * Dispatches an 'event-changed' custom event to notify listeners.
   */
  setCurrentEvent(event: Event): void {
    const previousEventId = this.currentEvent?.id ?? null;
    this.currentEvent = event;

    window.dispatchEvent(
      new CustomEvent<EventChangedDetail>("event-changed", {
        detail: {
          eventId: event.id,
          previousEventId,
        },
      }),
    );
  }

  /**
   * Get the currently active event.
   * @throws {Error} If no event has been set
   */
  getCurrentEvent(): Event {
    if (!this.currentEvent) {
      throw new Error(
        "No event selected. Call setCurrentEvent() before accessing the current event.",
      );
    }
    return this.currentEvent;
  }

  getCurrentEventId(): string {
    return this.getCurrentEvent().id;
  }

  hasCurrentEvent(): boolean {
    return this.currentEvent !== null;
  }

  clearCurrentEvent(): void {
    const previousEventId = this.currentEvent?.id ?? null;
    this.currentEvent = null;

    if (previousEventId) {
      window.dispatchEvent(
        new CustomEvent<EventChangedDetail>("event-changed", {
          detail: {
            eventId: "",
            previousEventId,
          },
        }),
      );
    }
  }
}
