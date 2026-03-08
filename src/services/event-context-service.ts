// src/services/event-context-service.ts
import type { Event, EventChangedDetail } from "../models/event";
import type { EventApiService } from "./event-api-service";

/**
 * Service for managing the current event context.
 * Handles event selection, switching, loading, and notifying components of changes.
 *
 * This service acts as a central source of truth for which event
 * the user is currently viewing/booking seats for.
 */
export class EventContextService {
  private currentEvent: Event | null = null;
  private readonly STORAGE_KEY = "lastViewedEventId";
  private eventApiService: EventApiService;

  constructor(eventApiService: EventApiService) {
    this.eventApiService = eventApiService;
  }

  /**
   * Initialize and load an event based on priority:
   * 1. URL parameter (?eventId=...)
   * 2. localStorage (last viewed event)
   * 3. First available event from API
   *
   * @returns Promise resolving to the loaded Event
   */
  async initializeEvent(): Promise<Event> {
    const eventId = await this.determineEventId();
    const event = await this.eventApiService.getEvent(eventId);
    this.setCurrentEvent(event);
    this.saveLastViewedEventId(event.id);
    return event;
  }

  /**
   * Load a specific event by ID and set it as current.
   *
   * @param eventId - The event ID to load
   * @returns Promise resolving to the loaded Event
   */
  async loadEvent(eventId: string): Promise<Event> {
    const event = await this.eventApiService.getEvent(eventId);
    this.setCurrentEvent(event);
    this.saveLastViewedEventId(event.id);
    return event;
  }

  /**
   * Set the current active event.
   * Dispatches an 'event-changed' custom event to notify listeners.
   *
   * @param event - The event to set as current
   */
  setCurrentEvent(event: Event): void {
    const previousEventId = this.currentEvent?.id ?? null;
    this.currentEvent = event;

    // Notify all listeners that the event has changed
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
   * Throws an error if no event is selected.
   *
   * @returns The current event
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

  /**
   * Get the current event ID.
   * Throws an error if no event is selected.
   *
   * @returns The current event ID
   * @throws {Error} If no event has been set
   */
  getCurrentEventId(): string {
    return this.getCurrentEvent().id;
  }

  /**
   * Check if an event is currently selected.
   *
   * @returns True if an event is set, false otherwise
   */
  hasCurrentEvent(): boolean {
    return this.currentEvent !== null;
  }

  /**
   * Clear the current event selection.
   * Useful when navigating away from event-specific views.
   */
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

  /**
   * Determine which event ID to load based on priority:
   * 1. URL parameter (?eventId=...)
   * 2. localStorage (last viewed event)
   * 3. First available event from API
   *
   * @returns Promise resolving to the event ID to load
   * @private
   */
  private async determineEventId(): Promise<string> {
    // 1. Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlEventId = urlParams.get("eventId");
    if (urlEventId) {
      console.log(`📍 Loading event from URL: ${urlEventId}`);
      return urlEventId;
    }

    // 2. Check localStorage for last viewed event
    const lastEventId = localStorage.getItem(this.STORAGE_KEY);
    if (lastEventId) {
      console.log(`📍 Loading last viewed event: ${lastEventId}`);
      return lastEventId;
    }

    // 3. Default to first available event
    console.log("📍 Loading first available event");
    const events = await this.eventApiService.getAllEvents();
    if (events.length === 0) {
      throw new Error("No events available");
    }
    return events[0].id;
  }

  /**
   * Save the event ID to localStorage for future visits.
   *
   * @param eventId - The event ID to save
   * @private
   */
  private saveLastViewedEventId(eventId: string): void {
    localStorage.setItem(this.STORAGE_KEY, eventId);
  }
}
