// src/services/event-api-service.ts
import type { Event } from "../models/event";

/**
 * Service for loading event data from the backend API.
 * In the future, this will fetch events from AWS API Gateway + Lambda.
 *
 * For now, returns mock data for development.
 */
export class EventApiService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = "/api") {
    // Store apiBaseUrl for future use when implementing real API calls
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Get a specific event by ID.
   * TODO: Replace mock with actual API call to AWS API Gateway
   *
   * @param eventId - The event ID to fetch
   * @returns Promise resolving to the Event
   */
  async getEvent(eventId: string): Promise<Event> {
    // TODO: Replace with actual API call
    // Example implementation (currently commented out):
    // const response = await fetch(`${this.apiBaseUrl}/events/${eventId}`);
    // if (!response.ok) throw new Error(`Failed to load event ${eventId}`);
    // return await response.json();

    // Mock data for development
    // Note: apiBaseUrl will be used once real API is implemented
    console.log(`[EventApiService] Mock mode - apiBaseUrl: ${this.apiBaseUrl}`);
    return this.getMockEvent(eventId);
  }

  /**
   * Get all available events.
   * TODO: Replace mock with actual API call to AWS API Gateway
   *
   * @returns Promise resolving to array of Events
   */
  async getAllEvents(): Promise<Event[]> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${this.apiBaseUrl}/events`);
    // if (!response.ok) throw new Error('Failed to load events');
    // return await response.json();

    // Mock data for development
    return [
      this.getMockEvent("event-1"),
      this.getMockEvent("event-2"),
      this.getMockEvent("event-3"),
    ];
  }

  /**
   * Mock event data for development.
   * This simulates what the backend API will return.
   */
  private getMockEvent(eventId: string): Event {
    const mockEvents: Record<string, Event> = {
      "event-1": {
        id: "event-1",
        title: "Frühjahrskonzert 2026",
        date: "2026-05-15",
        venue: "St Johann Schaffhausen",
        seatLayoutUrl: "/seats-layout.svg",
        description:
          "Unser traditionelles Frühjahrskonzert mit Werken von Bach und Händel",
        startTime: "19:30",
        endTime: "21:30",
      },
      "event-2": {
        id: "event-2",
        title: "Sommerkonzert 2026",
        date: "2026-07-20",
        venue: "Konzerthaus Berlin",
        seatLayoutUrl: "/seats-layout.svg",
        description: "Sommerliche Chormusik unter freiem Himmel",
        startTime: "20:00",
        endTime: "22:00",
      },
      "event-3": {
        id: "event-3",
        title: "Weihnachtskonzert 2026",
        date: "2026-12-20",
        venue: "Dom zu Freiburg",
        seatLayoutUrl: "/seats-layout.svg",
        description: "Festliche Weihnachtsmusik für die ganze Familie",
        startTime: "18:00",
        endTime: "20:00",
      },
    };

    const event = mockEvents[eventId];
    if (!event) {
      throw new Error(`Event with ID '${eventId}' not found`);
    }
    return event;
  }
}
