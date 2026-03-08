// src/models/event.ts

/**
 * Represents a choir performance event
 */
export interface Event {
  id: string;
  title: string;
  date: string; // ISO date string
  venue: string;
  seatLayoutUrl: string; // URL to the SVG seat layout file
  description?: string;
  startTime?: string; // e.g., "19:30"
  endTime?: string; // e.g., "21:30"
}

/**
 * Event change notification detail
 */
export interface EventChangedDetail {
  eventId: string;
  previousEventId: string | null;
}
