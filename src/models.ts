// src/domain/models.ts

// Seat categories as string literal types
export type SeatCategory = "cat-1" | "cat-2" | "cat-3" | "cat-4";

// Seat status as string literal types
export type SeatStatus = "free" | "reserved" | "booked";

// Seat interface
export interface Seat {
  id: number;
  row: string;
  number: number;
  category: SeatCategory;
  status: SeatStatus;
}

// Cart item
export interface CartItem {
  concertId: string;     
  seatId: number;        
  category: SeatCategory; 
  price: number;         
  addedAt: Date;         
}

// Optional: Concert interface
export interface Concert {
  id: string;
  name: string;
  date: string;
  venue: string;
}
