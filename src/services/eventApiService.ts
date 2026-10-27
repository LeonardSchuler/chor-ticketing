// src/services/event-api-service.ts
import type { Event } from "../models/event";
import type { Reservation } from "../models/reservation";

type ApiEvent = Omit<Event, "id"> & { id: number | string };

/**
 * Service for loading event data from the backend API.
 */
export class EventApiService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = "/api") {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Get a specific event by ID.
   */
  async getEvent(eventId: string): Promise<Event> {
    const response = await fetch(`${this.apiBaseUrl}/events/${eventId}`);
    if (!response.ok) throw new Error(`Failed to load event ${eventId}`);
    return this.toEvent((await response.json()) as ApiEvent);
  }

  /**
   * Get all available events.
   */
  async getAllEvents(): Promise<Event[]> {
    const response = await fetch(`${this.apiBaseUrl}/events`);
    if (!response.ok) throw new Error("Failed to load events");
    const events = (await response.json()) as ApiEvent[];
    return events.map((e) => this.toEvent(e));
  }

  /**
   * Get the IDs of permanently booked seats for an event.
   */
  async getBookedSeatIds(eventId: string): Promise<string[]> {
    const response = await fetch(`${this.apiBaseUrl}/events/${eventId}/bookings`);
    if (!response.ok) throw new Error(`Failed to load bookings for event ${eventId}`);
    const bookings = (await response.json()) as { seatId: string }[];
    return bookings.map((b) => b.seatId);
  }

  /**
   * Get the active (unexpired) reservations for an event, from all users.
   */
  async getActiveReservations(eventId: string): Promise<Reservation[]> {
    const response = await fetch(`${this.apiBaseUrl}/events/${eventId}/reservations`);
    if (!response.ok) throw new Error(`Failed to load reservations for event ${eventId}`);
    const reservations = (await response.json()) as {
      id: string;
      seatId: string;
      createdAt: string;
      expiresAt: string;
    }[];
    return reservations.map((r) => ({
      id: r.id,
      seatId: r.seatId,
      eventId,
      createdAt: new Date(r.createdAt),
      expiresAt: new Date(r.expiresAt),
    }));
  }

  private toEvent(event: ApiEvent): Event {
    return { ...event, id: String(event.id) };
  }
}
