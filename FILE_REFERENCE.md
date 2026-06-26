# RideShare File Reference Guide

A quick reference for all files in the project, what they do, and how they interact.

## Core Application Files

### `/app/layout.tsx`
**Purpose**: Root layout component wrapping all pages
**Key Components**:
- Navbar - Navigation bar with auth buttons
- Toaster - Toast notification provider
- Metadata - SEO configuration
- Global styles
**Exports**: Default layout function

### `/app/page.tsx`
**Purpose**: Home page - shows available rides or landing page
**Displays**:
- Landing page if user not authenticated
- List of available rides if authenticated
- Create Ride button for logged-in users
**Dependencies**: useAuthStore, useRides, RideCard

### `/app/login/page.tsx`
**Purpose**: Login page wrapper
**Displays**: LoginForm component
**Flow**: Email/password validation → API call → store token

### `/app/register/page.tsx`
**Purpose**: Registration page wrapper
**Displays**: RegisterForm component
**Flow**: Form validation → API call → create account → auto login

### `/app/create-ride/page.tsx`
**Purpose**: Create new ride page wrapper
**Displays**: CreateRideForm component
**Flow**: Form → geolocation → API call → create ride

### `/app/rides/[id]/page.tsx`
**Purpose**: Individual ride detail page
**Displays**: RideDetail component with map and booking options
**Params**: Dynamic route parameter `id` for ride ID
**Features**: Map, driver info, booking controls

### `/app/my-bookings/page.tsx`
**Purpose**: User's bookings and reservations
**Displays**: MyBookings component with list of user's rides
**Flow**: Fetch user's bookings → display cards

### `/app/profile/[id]/page.tsx`
**Purpose**: User profile view
**Displays**: UserProfile component with user stats
**Params**: Dynamic route parameter `id` for user ID

### `/app/globals.css`
**Purpose**: Global styles and Tailwind configuration
**Contains**:
- Tailwind directives
- Design tokens (colors, fonts)
- Global resets

---

## Component Files

### Navigation & Layout

#### `/components/Navbar.tsx`
**Purpose**: Top navigation bar
**Features**:
- Logo/branding
- Navigation links (Rides, Create Ride, Bookings)
- Auth buttons (Login/Signup or user menu)
- Responsive on mobile
**State**: useAuthStore for user data and logout

### Authentication Components

#### `/components/auth/LoginForm.tsx`
**Purpose**: Login form with validation
**Fields**: Email, Password
**Validation**: Zod schema
**Flow**: 
1. User enters credentials
2. Form validates with Zod
3. API call to login endpoint
4. Store token in localStorage
5. Update Zustand store
6. Redirect to home

#### `/components/auth/RegisterForm.tsx`
**Purpose**: Registration form with validation
**Fields**: Name, Email, Phone, Password, Confirm Password
**Validation**: Zod schema with password match check
**Flow**: Similar to login but creates new account

### Ride Components

#### `/components/rides/RideCard.tsx`
**Purpose**: Individual ride preview card
**Displays**:
- Driver avatar and name/rating
- Route (departure → arrival)
- Date, time, seats, price
- Status badge
**Interaction**: Click to navigate to ride detail
**Props**: ride object

#### `/components/rides/RideDetail.tsx`
**Purpose**: Full ride details with actions
**Features**:
- Map display (RideMap component)
- Trip details (route, time, seats)
- Driver information and contact
- Booking requests (for driver)
- Book button or status message
- Socket.io integration for real-time updates
**State**: Real-time location updates, booking status

#### `/components/rides/RideMap.tsx`
**Purpose**: Interactive map showing route and locations
**Features**:
- Leaflet map
- Color-coded markers (start, end, driver)
- Route polyline
- Popups on markers
- Real-time driver location
**Props**: Departure/arrival locations, driver location
**Library**: react-leaflet + leaflet

#### `/components/rides/CreateRideForm.tsx`
**Purpose**: Form to create new ride
**Fields**:
- Departure address
- Arrival address
- Departure date/time
- Seats available
- Price per seat
- Description
**Validation**: Zod schema
**Flow**: Form → validation → API call → create ride

### Bookings Components

#### `/components/bookings/MyBookings.tsx`
**Purpose**: Display user's upcoming bookings
**Features**:
- List of rides user has booked
- Ride cards with key info
- Loading skeleton states
- Empty state message
**Data**: Fetches from useMyBookings hook

### Profile Components

#### `/components/profile/UserProfile.tsx`
**Purpose**: View user profile and statistics
**Displays**:
- User avatar and name
- Rating and total rides
- Contact info
- Member since date
- Statistics cards
**Props**: userId parameter from route

---

## Library Files

### `/lib/types.ts`
**Purpose**: TypeScript interfaces for type safety
**Interfaces**:
- `User` - User account data
- `Location` - Geographic coordinates
- `Ride` - Ride listing
- `Passenger` - Ride passenger info
- `BookingRequest` - Pending booking
- `DriverLocation` - Real-time location
- `AuthResponse` - Login/register response

### `/lib/schemas.ts`
**Purpose**: Zod validation schemas for forms
**Schemas**:
- `loginSchema` - Email, password
- `registerSchema` - Name, email, phone, password
- `createRideSchema` - Ride creation fields
- `bookRideSchema` - Booking request fields
**Exports**: Schema + TypeScript types

### `/lib/api.ts`
**Purpose**: Axios API client with interceptors
**Features**:
- Base configuration (URL, headers)
- Request interceptor (adds JWT token)
- Response interceptor (handles 401 errors)
**Exports**:
- `authAPI` - Login, register, logout, get current user
- `ridesAPI` - CRUD operations for rides
- `bookingsAPI` - Booking management
- `usersAPI` - User profiles and ratings
- `locationAPI` - Driver location updates

### `/lib/socket.ts`
**Purpose**: Socket.io service for real-time updates
**Features**:
- Initialize connection with auth
- Automatic reconnection
- Event subscriptions
- Location emitting
**Functions**:
- `initSocket()` - Connect to server
- `closeSocket()` - Disconnect
- `subscribeToDriverLocation()` - Listen for driver location
- `emitDriverLocation()` - Send driver location
- `subscribeToRideUpdates()` - Listen for ride changes

### `/lib/store.ts`
**Purpose**: Zustand store for global auth state
**State**:
- `user` - Current user object
- `token` - JWT token
- `isAuthenticated` - Auth status
- `isLoading` - Loading state
**Methods**:
- `setUser()` - Set current user
- `setToken()` - Set JWT token
- `logout()` - Clear auth
- `checkAuth()` - Verify current session
**Persistence**: localStorage (via persist middleware)

---

## Hooks

### `/hooks/useRides.ts`
**Purpose**: Custom hooks for ride data fetching
**Hooks**:
- `useRides(filters?)` - Fetch all rides with optional filters
- `useRide(rideId)` - Fetch single ride by ID
- `useMyBookings()` - Fetch user's bookings
**Returns**: Data, loading state, error state, setters

---

## UI Component Library

### `/components/ui/*.tsx`
**Purpose**: shadcn/ui components
**Files**:
- `button.tsx` - Styled button component
- `card.tsx` - Card container
- `input.tsx` - Text input field
- `avatar.tsx` - User avatar
- `badge.tsx` - Status badges
- `skeleton.tsx` - Loading placeholder
- `separator.tsx` - Divider line
- Others...
**Style**: Tailwind + Radix UI

---

## Configuration Files

### `next.config.mjs`
**Purpose**: Next.js configuration
**Settings**: Turbopack bundler, compiler options

### `tailwind.config.ts`
**Purpose**: Tailwind CSS theme customization
**Theme**: Colors, spacing, fonts, etc.

### `tsconfig.json`
**Purpose**: TypeScript configuration
**Path Aliases**: `@/*` maps to root directory

### `package.json`
**Purpose**: Project dependencies and scripts
**Key Dependencies**:
- `next` - Framework
- `react` - UI library
- `tailwindcss` - Styling
- `zustand` - State management
- `react-hook-form` - Form handling
- `zod` - Validation
- `axios` - HTTP client
- `socket.io-client` - Real-time
- `leaflet` - Maps
- `sonner` - Toasts

---

## Data Flow Diagram

```
User Action (Click Button)
         ↓
Component (e.g., LoginForm)
         ↓
useForm + Zod Validation
         ↓
API Call via apiClient (lib/api.ts)
         ↓
Request Interceptor (adds token)
         ↓
Backend Server
         ↓
Response Handler
         ↓
Zustand Store (lib/store.ts)
         ↓
Component Re-render
         ↓
UI Update
```

## Socket.io Data Flow

```
Component (useEffect)
         ↓
subscribeToDriverLocation() (lib/socket.ts)
         ↓
Socket.io Listen Event
         ↓
Server Emits: ride:{id}:location
         ↓
Callback Function Updates State
         ↓
RideMap Re-renders with New Location
         ↓
User Sees Live Driver Location
```

## State Management Flow

```
Authentication State (Zustand)
         ↓
localStorage (persisted)
         ↓
useAuthStore Hook
         ↓
Navbar Component
         ↓
Protected Routes
         ↓
Conditional Navigation
```

---

## Key Integration Points

### API Integration
- All components that need data use `lib/api.ts`
- Interceptors automatically handle JWT token
- Error handling via catch blocks + toast notifications

### Real-time Updates
- Components use `lib/socket.ts` for subscriptions
- Socket events trigger state updates
- Components automatically re-render

### Form Handling
- React Hook Form for form state
- Zod for validation schemas
- Error messages display inline

### State Management
- Global auth state via Zustand (lib/store.ts)
- Local component state via useState for UI
- Custom hooks for data fetching

---

## File Dependencies Summary

```
app/layout.tsx
├── components/Navbar.tsx
│   └── lib/store.ts
├── components/ui/*
└── sonner/Toaster

app/page.tsx
├── lib/store.ts
├── hooks/useRides.ts
│   └── lib/api.ts
├── components/rides/RideCard.tsx
└── components/ui/*

components/auth/LoginForm.tsx
├── lib/schemas.ts
├── lib/api.ts
├── lib/store.ts
└── react-hook-form

components/rides/RideDetail.tsx
├── lib/socket.ts
├── components/rides/RideMap.tsx
│   └── react-leaflet
├── lib/api.ts
└── components/ui/*
```

---

## Quick Editing Guide

### To Add a New Page
1. Create file in `/app` (e.g., `/app/new-page/page.tsx`)
2. Use existing components or create new ones in `/components`
3. Import hooks from `/hooks` for data
4. Use API client from `/lib/api.ts`

### To Add a New Component
1. Create file in `/components` or subdir
2. Import UI components from `/components/ui`
3. Use Tailwind for styling
4. Export as default

### To Modify Form Validation
1. Edit schema in `/lib/schemas.ts`
2. Update form component to show new fields
3. Update API call in `/lib/api.ts`

### To Add New API Endpoint
1. Add method to appropriate API object in `/lib/api.ts`
2. Use apiClient with correct method (GET, POST, etc.)
3. Update types in `/lib/types.ts` if needed
4. Call from components via hooks or direct import

### To Add Real-time Feature
1. Create subscription in `/lib/socket.ts`
2. Use subscribeToX() in component useEffect
3. Handle event data and update state
4. Component auto-updates on socket event

---

**Last Updated**: June 26, 2025  
**Status**: Complete and functional
