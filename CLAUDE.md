# Choir Ticketing App

## Project Overview
A ticketing application for a choir built with vanilla JavaScript (no frameworks). Users can browse events and book seats for choir performances.

## Tech Stack
- **Frontend**: Vanilla TypeScript with Web Components
- **Build Tool**: Vite (rolldown-vite variant)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier

## Core Features

### User Features
- View available choir events
- Browse seat availability for each event
- Select and book seats
- View booking confirmation

### Event Management
- Display event details (date, time, venue, etc.)
- Show seat map/layout
- Track seat availability in real-time
- Handle seat reservations

## Project Structure
```
chor-ticketing/
├── src/
│   ├── main.ts              # Application entry point
│   ├── style.css            # Global styles (Tailwind)
│   └── components/          # Web Components
│       ├── SeatsMap.ts      # Seat selection component
│       └── SeatsMap.css     # Component-specific styles
├── public/                  # Static assets
├── index.html               # Main HTML file
├── eslint.config.ts         # ESLint configuration
├── .prettierrc              # Prettier configuration
├── vite.config.ts           # Vite build configuration
└── tsconfig.json            # TypeScript configuration
```

## Development Guidelines
- Keep it simple with vanilla JavaScript/TypeScript
- No framework dependencies (React, Vue, Angular, etc.)
- Use Web Components for reusable UI elements
- Clean, maintainable code structure
- Responsive design for mobile and desktop
- Intuitive user experience for booking seats
- Tailwind CSS for utility-first styling

## Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
```

## Future Enhancements
- User authentication
- Payment integration
- Ticket generation
- Email confirmations
- Admin panel for event management
- Seat selection analytics
