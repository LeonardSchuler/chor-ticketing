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
- **Payment Processing**: Stripe (planned)
- **Hosting & Infrastructure**: AWS
  - S3 for static frontend hosting
  - CloudFront for CDN and global distribution
  - API Gateway for REST API endpoints
  - Lambda for serverless backend functions
  - DynamoDB for NoSQL database
  - Cognito for user authentication and authorization

## Core Features

### User Features
- View available choir events
- Browse seat availability for each event
- Select and book seats
- **Cart functionality**: Add multiple seats to a shopping cart before checkout
  - Add/remove seats from cart
  - View cart summary with selected seats and total price
  - Persist cart state during the session
  - Clear cart or proceed to checkout
  - **Seat reservation**: Seats added to cart are temporarily reserved for a limited time
    - Reserved seats are locked and unavailable to other users
    - Reservation expires after a set duration (e.g., 10-15 minutes)
    - Timer displayed to user showing remaining reservation time
    - Seats automatically released if not purchased before expiration
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
│   ├── main.ts                   # Application entry point
│   ├── app.ts                    # App initialization, DI container, global state
│   ├── style.css                 # Tailwind imports / global styles
│   ├── components/               # Web Components (UI layer)
│   │   ├── SeatsMap.ts           # Seat selection component
│   │   ├── SeatsMap.svg          # Venue with all seats
│   │   ├── SeatsMap.css          # Component-specific styles
│   │   ├── CartPanel.ts          # Shopping cart UI component
│   │   └── CountdownTimer.ts     # Reservation countdown timer
│   ├── controllers/              # Thin interface adapters
│   │   ├── SeatsController.ts    # Handles seat selection/display
│   │   ├── CartController.ts     # Handles cart interactions
│   │   └── CheckoutController.ts # Handles checkout flow
│   ├── application/              # Use cases / business orchestration
│   │   ├── SeatReservationUseCase.ts  # Seat reservation business logic
│   │   └── BookingUseCase.ts          # Booking completion logic
│   ├── services/                 # Infrastructure & domain services
│   │   ├── SeatService.ts        # Backend seat reservation APIs
│   │   ├── CartService.ts        # In-memory/localStorage cart management
│   │   └── PaymentService.ts     # Stripe integration
│   ├── models/                   # TypeScript interfaces and types
│   │   ├── Seat.ts               # Seat entity and types
│   │   ├── CartItem.ts           # Cart item types
│   │   ├── Reservation.ts        # Reservation types
│   │   └── Booking.ts            # Booking types
│   └── utils/                    # Generic helpers
│       ├── date.ts               # Date formatting and manipulation
│       ├── storage.ts            # LocalStorage wrapper utilities
│       └── currency.ts           # Currency formatting
├── public/                       # Static assets
├── index.html                    # Main HTML file
├── eslint.config.ts              # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── vite.config.ts                # Vite build configuration
└── tsconfig.json                 # TypeScript configuration
```

### Architecture Layers

The project follows a clean architecture approach with clear separation of concerns:

1. **UI Layer (components/)**: Web Components that handle presentation and user interactions
   - Minimal logic, delegate to controllers
   - Focus on rendering and DOM manipulation

2. **Controller Layer (controllers/)**: Thin adapters between UI and business logic
   - Handle user input validation
   - Coordinate between UI components and use cases
   - Format data for presentation

3. **Application Layer (application/)**: Business logic and use case orchestration
   - Coordinate multiple services
   - Implement business rules and workflows
   - Independent of UI concerns

4. **Service Layer (services/)**: Infrastructure and domain services
   - API communication
   - Data persistence
   - External integrations (Stripe, etc.)

5. **Domain Layer (models/)**: Core business entities and types
   - TypeScript interfaces and types
   - Domain models
   - No dependencies on other layers

6. **Utilities (utils/)**: Generic helper functions
   - Pure functions
   - Reusable across layers
   - No business logic

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

## Deployment
The application is deployed to AWS with the following serverless architecture:

### Frontend
- **S3**: Hosts the static frontend files (HTML, CSS, JS)
- **CloudFront**: CDN distribution with multiple origins:
  - S3 bucket for static frontend assets (HTML, CSS, JS)
  - API Gateway for backend API endpoints
  - Provides fast global access, HTTPS support, and caching for both static and API content
- Build output from `npm run build` is deployed to S3

### Backend
- **API Gateway**: RESTful API endpoints for frontend communication
  - Configured as a CloudFront origin for unified domain and caching
  - Integrated with Cognito authorizers for secured endpoints
- **Lambda**: Serverless functions handling business logic
  - Event management
  - Seat booking logic
  - Reservation handling
  - Integration with Stripe for payments
- **DynamoDB**: NoSQL database for storing:
  - Events and performances
  - Seat availability and layouts
  - Booking records
  - User information
- **Cognito**: User authentication and authorization
  - User pools for user registration and sign-in
  - JWT token generation for API authorization
  - User profile management
  - Password reset and email verification

## Architecture Decisions

### Cart and Seat Reservation Strategy

**Decision**: Implement cart functionality using REST API with optimistic locking, NOT WebSockets (initially)

**Rationale**:
- **Phase 1 (Current)**: REST API-based cart implementation
  - Cart state managed in frontend (memory/localStorage)
  - API calls to backend to reserve seats when added to cart
  - Frontend timer manages reservation countdown
  - Optimistic UI updates with server-side validation
  - Optional polling (every 5-10 seconds) for seat availability updates
  - Simpler implementation, faster time to market
  - Sufficient for initial launch and moderate traffic

- **Phase 2 (Future)**: Add WebSockets when needed
  - Real-time seat availability updates across all users
  - Instant notification when seats become available
  - Cross-browser-tab synchronization
  - Better UX for high-traffic events
  - Requires API Gateway WebSocket APIs + additional Lambda handlers

**Implementation Details**:
- Frontend cart operations are immediate and local
- Backend reserves seats via REST API (POST /reservations)
- Reservation includes expiration timestamp (10-15 minutes)
- Frontend displays countdown timer
- Backend automatically releases expired reservations
- Conflict resolution: API returns error if seat already reserved

**When to Migrate to WebSockets**:
- High concurrent user load causing polling overhead
- User feedback indicates need for real-time updates
- Cross-tab synchronization becomes a priority
- Cost analysis shows WebSockets would reduce API calls

## Future Enhancements
- Payment integration with Stripe
  - Stripe Checkout for secure payment processing
  - Support for one-time payments
  - Webhook integration for payment confirmations
  - Handle refunds and cancellations
- Ticket generation (PDF/email)
- Email confirmations via SES
- Admin panel for event management
- Social authentication (Google, Facebook) via Cognito identity providers
- **WebSocket integration** for real-time seat availability updates (Phase 2)
