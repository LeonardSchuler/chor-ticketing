// src/application/eventSelectionUseCase.ts
import type { Event } from "../models/event";
import type { EventApiService } from "../services/eventApiService";
import type { EventContextService } from "../services/eventContextService";

/**
 * Use case for selecting and initializing the active event.
 *
 * Orchestrates event ID resolution, loading from the API,
 * updating the event context, and persisting the last viewed event.
 */
export class EventSelectionUseCase {
  private readonly STORAGE_KEY = "lastViewedEventId";
  private eventApiService: EventApiService;
  private eventContextService: EventContextService;

  constructor(
    eventApiService: EventApiService,
    eventContextService: EventContextService,
  ) {
    this.eventApiService = eventApiService;
    this.eventContextService = eventContextService;
  }

  /**
   * Initialize the active event based on priority:
   * 1. URL parameter (?eventId=...)
   * 2. localStorage (last viewed event)
   * 3. First available event from API
   *
   * @returns Promise resolving to the loaded Event
   */
  async initializeEvent(): Promise<Event> {
    const eventId = await this.determineEventId();
    return this.selectEvent(eventId);
  }

  /**
   * Select a specific event by ID, set it as current, and persist the choice.
   *
   * @param eventId - The event ID to load
   * @returns Promise resolving to the loaded Event
   */
  async selectEvent(eventId: string): Promise<Event> {
    const event = await this.eventApiService.getEvent(eventId);
    this.eventContextService.setCurrentEvent(event);
    this.saveLastViewedEventId(event.id);
    return event;
  }

  /**
   * Determine which event ID to load based on priority:
   * 1. URL parameter (?eventId=...)
   * 2. localStorage (last viewed event)
   * 3. First available event from API
   */
  private async determineEventId(): Promise<string> {
    const urlParams = new URLSearchParams(window.location.search);
    const urlEventId = urlParams.get("eventId");
    if (urlEventId) {
      return urlEventId;
    }

    const lastEventId = localStorage.getItem(this.STORAGE_KEY);
    if (lastEventId) {
      return lastEventId;
    }

    const events = await this.eventApiService.getAllEvents();
    if (events.length === 0) {
      throw new Error("No events available");
    }
    return events[0].id;
  }

  private saveLastViewedEventId(eventId: string): void {
    localStorage.setItem(this.STORAGE_KEY, eventId);
  }
}
