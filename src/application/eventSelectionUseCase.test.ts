// src/application/eventSelectionUseCase.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { EventSelectionUseCase } from "./eventSelectionUseCase";
import type { EventApiService } from "../services/eventApiService";
import type { EventContextService } from "../services/eventContextService";
import type { Event } from "../models/event";

describe("EventSelectionUseCase", () => {
  let useCase: EventSelectionUseCase;
  let mockEventApiService: EventApiService;
  let mockEventContextService: EventContextService;
  let mockEvent: Event;
  let anotherMockEvent: Event;

  beforeEach(() => {
    mockEventApiService = {
      getEvent: vi.fn(),
      getAllEvents: vi.fn(),
    } as unknown as EventApiService;

    mockEventContextService = {
      setCurrentEvent: vi.fn(),
      getCurrentEvent: vi.fn(),
      getCurrentEventId: vi.fn(),
      hasCurrentEvent: vi.fn(),
      clearCurrentEvent: vi.fn(),
    } as unknown as EventContextService;

    useCase = new EventSelectionUseCase(mockEventApiService, mockEventContextService);

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
    localStorage.clear();
    window.history.replaceState({}, "", window.location.pathname);
  });

  describe("initializeEvent", () => {
    it("should load event from URL parameter when present", async () => {
      window.history.replaceState({}, "", "?eventId=event-2");
      vi.mocked(mockEventApiService.getEvent).mockResolvedValue(anotherMockEvent);

      const event = await useCase.initializeEvent();

      expect(mockEventApiService.getEvent).toHaveBeenCalledWith("event-2");
      expect(event).toEqual(anotherMockEvent);
      expect(mockEventContextService.setCurrentEvent).toHaveBeenCalledWith(anotherMockEvent);
      expect(localStorage.getItem("lastViewedEventId")).toBe("event-2");
    });

    it("should load event from localStorage when no URL parameter", async () => {
      localStorage.setItem("lastViewedEventId", "event-1");
      vi.mocked(mockEventApiService.getEvent).mockResolvedValue(mockEvent);

      const event = await useCase.initializeEvent();

      expect(mockEventApiService.getEvent).toHaveBeenCalledWith("event-1");
      expect(event).toEqual(mockEvent);
      expect(mockEventContextService.setCurrentEvent).toHaveBeenCalledWith(mockEvent);
    });

    it("should load first available event when no URL parameter or localStorage", async () => {
      vi.mocked(mockEventApiService.getAllEvents).mockResolvedValue([mockEvent, anotherMockEvent]);
      vi.mocked(mockEventApiService.getEvent).mockResolvedValue(mockEvent);

      const event = await useCase.initializeEvent();

      expect(mockEventApiService.getAllEvents).toHaveBeenCalled();
      expect(mockEventApiService.getEvent).toHaveBeenCalledWith("event-1");
      expect(event).toEqual(mockEvent);
      expect(mockEventContextService.setCurrentEvent).toHaveBeenCalledWith(mockEvent);
      expect(localStorage.getItem("lastViewedEventId")).toBe("event-1");
    });

    it("should throw error when no events available", async () => {
      vi.mocked(mockEventApiService.getAllEvents).mockResolvedValue([]);

      await expect(useCase.initializeEvent()).rejects.toThrow("No events available");
    });

    it("should call setCurrentEvent when initializing", async () => {
      vi.mocked(mockEventApiService.getAllEvents).mockResolvedValue([mockEvent]);
      vi.mocked(mockEventApiService.getEvent).mockResolvedValue(mockEvent);

      await useCase.initializeEvent();

      expect(mockEventContextService.setCurrentEvent).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe("selectEvent", () => {
    it("should load specific event by ID", async () => {
      vi.mocked(mockEventApiService.getEvent).mockResolvedValue(anotherMockEvent);

      const event = await useCase.selectEvent("event-2");

      expect(mockEventApiService.getEvent).toHaveBeenCalledWith("event-2");
      expect(event).toEqual(anotherMockEvent);
      expect(mockEventContextService.setCurrentEvent).toHaveBeenCalledWith(anotherMockEvent);
      expect(localStorage.getItem("lastViewedEventId")).toBe("event-2");
    });

    it("should call setCurrentEvent when selecting", async () => {
      vi.mocked(mockEventApiService.getEvent).mockResolvedValue(mockEvent);

      await useCase.selectEvent("event-1");

      expect(mockEventContextService.setCurrentEvent).toHaveBeenCalledWith(mockEvent);
    });
  });
});
