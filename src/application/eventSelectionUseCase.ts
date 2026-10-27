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
 * their respective adapters, initializing the seat service, and updating the event
 * context.
 */
export class EventSelectionUseCase {
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
   * 2. First available event from API (also used if the URL id is unknown)
   *
   * The resolved event id is written back to the URL.
   */
  async initializeEvent(): Promise<EventSelectionResult> {
    const urlEventId = this.readEventIdFromUrl();
    let result: EventSelectionResult;
    if (urlEventId) {
      try {
        result = await this.selectEvent(urlEventId);
      } catch (error) {
        console.warn(`Event '${urlEventId}' not found, falling back to first event`, error);
        result = await this.selectEvent(await this.firstEventId());
      }
    } else {
      result = await this.selectEvent(await this.firstEventId());
    }
    this.writeEventIdToUrl(result.event.id);
    return result;
  }

  /**
   * Select a specific event by ID: load event data and seat layout,
   * initialize seats, and update context.
   */
  async selectEvent(eventId: string): Promise<EventSelectionResult> {
    const event = await this.eventApiService.getEvent(eventId);
    const { seats, svgElement } = await this.seatLayoutAdapter.load(event.seatLayoutUrl);
    this.seatService.initializeSeats(seats, event.id);
    this.eventContextService.setCurrentEvent(event);
    return { event, svgElement };
  }

  private async firstEventId(): Promise<string> {
    const events = await this.eventApiService.getAllEvents();
    if (events.length === 0) {
      throw new Error("No events available");
    }
    return events[0].id;
  }

  private readEventIdFromUrl(): string | null {
    for (const [key, value] of new URLSearchParams(window.location.search)) {
      if (key.toLowerCase() === "eventid" && value) return value;
    }
    return null;
  }

  private writeEventIdToUrl(eventId: string): void {
    const url = new URL(window.location.href);
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase() === "eventid") url.searchParams.delete(key);
    }
    url.searchParams.set("eventId", eventId);
    window.history.replaceState({}, "", url);
  }
}
