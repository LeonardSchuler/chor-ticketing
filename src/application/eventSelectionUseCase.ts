// src/application/eventSelectionUseCase.ts
import type { Event } from "../models/event";
import type { EventApiService } from "../services/eventApiService";
import type { EventContextService } from "../services/eventContextService";
import type { SvgSeatLayoutAdapter } from "../infrastructure/svgSeatLayoutAdapter";
import type { SeatService } from "../services/seatService";

export type EventSelectionResult = {
  event: Event;
  svgElement: SVGElement;
};

/**
 * Use case for selecting and initializing the active event.
 *
 * Orchestrates event ID resolution, loading event data and seat layout from
 * their respective adapters, initializing the seat service, updating the event
 * context, and persisting the last viewed event.
 */
export class EventSelectionUseCase {
  private readonly STORAGE_KEY = "lastViewedEventId";
  private eventApiService: EventApiService;
  private eventContextService: EventContextService;
  private seatLayoutAdapter: SvgSeatLayoutAdapter;
  private seatService: SeatService;

  constructor(
    eventApiService: EventApiService,
    eventContextService: EventContextService,
    seatLayoutAdapter: SvgSeatLayoutAdapter,
    seatService: SeatService,
  ) {
    this.eventApiService = eventApiService;
    this.eventContextService = eventContextService;
    this.seatLayoutAdapter = seatLayoutAdapter;
    this.seatService = seatService;
  }

  /**
   * Initialize the active event based on priority:
   * 1. URL parameter (?eventId=...)
   * 2. localStorage (last viewed event)
   * 3. First available event from API
   */
  async initializeEvent(): Promise<EventSelectionResult> {
    const eventId = await this.determineEventId();
    return this.selectEvent(eventId);
  }

  /**
   * Select a specific event by ID: load event data and seat layout,
   * initialize seats, update context, and persist the choice.
   */
  async selectEvent(eventId: string): Promise<EventSelectionResult> {
    const event = await this.eventApiService.getEvent(eventId);
    const { seats, svgElement } = await this.seatLayoutAdapter.load(event.seatLayoutUrl);
    this.seatService.initializeSeats(seats, event.id);
    this.eventContextService.setCurrentEvent(event);
    this.saveLastViewedEventId(event.id);
    return { event, svgElement };
  }

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
