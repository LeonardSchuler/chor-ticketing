// src/services/event-context-service.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { EventContextService } from "./eventContextService";
import type { Event, EventChangedDetail } from "../models/event";

describe("EventContextService", () => {
  let service: EventContextService;
  let mockEvent: Event;
  let anotherMockEvent: Event;

  beforeEach(() => {
    service = new EventContextService();

    mockEvent = {
      id: "event-1",
      title: "Spring Concert 2026",
      date: "2026-05-15",
      venue: "City Hall",
      seatLayoutUrl: "/seats-layout.svg",
      description: "Annual spring concert",
      startTime: "19:30",
      endTime: "21:30",
    };
    anotherMockEvent = {
      id: "event-2",
      title: "Summer Festival",
      date: "2026-07-20",
      venue: "Open Air Theater",
      seatLayoutUrl: "/seats-layout-2.svg",
    };
  });

  afterEach(() => {
    window.history.replaceState({}, "", window.location.pathname);
  });

  describe("setCurrentEvent", () => {
    it("should set the current event", () => {
      service.setCurrentEvent(mockEvent);

      expect(service.getCurrentEvent()).toEqual(mockEvent);
      expect(service.getCurrentEventId()).toBe("event-1");
    });

    it("should dispatch 'event-changed' custom event", () => {
      const listener = vi.fn();
      window.addEventListener("event-changed", listener);

      service.setCurrentEvent(mockEvent);

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent<EventChangedDetail>;
      expect(event.detail.eventId).toBe("event-1");
      expect(event.detail.previousEventId).toBeNull();

      window.removeEventListener("event-changed", listener);
    });

    it("should include previous event ID when switching events", () => {
      const listener = vi.fn();
      window.addEventListener("event-changed", listener);

      service.setCurrentEvent(mockEvent);
      service.setCurrentEvent(anotherMockEvent);

      expect(listener).toHaveBeenCalledTimes(2);
      const secondEvent = listener.mock.calls[1][0] as CustomEvent<EventChangedDetail>;
      expect(secondEvent.detail.eventId).toBe("event-2");
      expect(secondEvent.detail.previousEventId).toBe("event-1");

      window.removeEventListener("event-changed", listener);
    });
  });

  describe("getCurrentEvent", () => {
    it("should throw error when no event is set", () => {
      expect(() => service.getCurrentEvent()).toThrow(
        "No event selected. Call setCurrentEvent() before accessing the current event.",
      );
    });

    it("should return the current event when set", () => {
      service.setCurrentEvent(mockEvent);
      const currentEvent = service.getCurrentEvent();

      expect(currentEvent).toEqual(mockEvent);
      expect(currentEvent.id).toBe("event-1");
      expect(currentEvent.title).toBe("Spring Concert 2026");
    });
  });

  describe("getCurrentEventId", () => {
    it("should throw error when no event is set", () => {
      expect(() => service.getCurrentEventId()).toThrow(
        "No event selected. Call setCurrentEvent() before accessing the current event.",
      );
    });

    it("should return the current event ID", () => {
      service.setCurrentEvent(mockEvent);
      expect(service.getCurrentEventId()).toBe("event-1");
    });
  });

  describe("hasCurrentEvent", () => {
    it("should return false when no event is set", () => {
      expect(service.hasCurrentEvent()).toBe(false);
    });

    it("should return true when an event is set", () => {
      service.setCurrentEvent(mockEvent);
      expect(service.hasCurrentEvent()).toBe(true);
    });

    it("should return false after clearing the event", () => {
      service.setCurrentEvent(mockEvent);
      service.clearCurrentEvent();
      expect(service.hasCurrentEvent()).toBe(false);
    });
  });

  describe("clearCurrentEvent", () => {
    it("should clear the current event", () => {
      service.setCurrentEvent(mockEvent);
      service.clearCurrentEvent();

      expect(service.hasCurrentEvent()).toBe(false);
      expect(() => service.getCurrentEvent()).toThrow();
    });

    it("should dispatch 'event-changed' event with empty eventId", () => {
      const listener = vi.fn();
      window.addEventListener("event-changed", listener);

      service.setCurrentEvent(mockEvent);
      service.clearCurrentEvent();

      expect(listener).toHaveBeenCalledTimes(2);
      const clearEvent = listener.mock.calls[1][0] as CustomEvent<EventChangedDetail>;
      expect(clearEvent.detail.eventId).toBe("");
      expect(clearEvent.detail.previousEventId).toBe("event-1");

      window.removeEventListener("event-changed", listener);
    });

    it("should not dispatch event if no event was set", () => {
      const listener = vi.fn();
      window.addEventListener("event-changed", listener);

      service.clearCurrentEvent();

      expect(listener).not.toHaveBeenCalled();

      window.removeEventListener("event-changed", listener);
    });
  });
});
