# RideShare - Campus Ride Sharing Application

A modern web application for campus ride sharing, enabling students to easily find and book rides or offer rides to other students on campus.

## Features

### Core Features
- **User Authentication**: Register and login with email and password
- **Browse Rides**: View available rides from other drivers
- **Create Rides**: Post your own ride with route, time, seats, and price
- **Book Rides**: Request to book seats on available rides
- **Ride Details**: View detailed information about rides including driver profile and ratings
- **Real-time Tracking**: See driver's live location on a map (with Socket.io integration)
- **My Bookings**: Track all your bookings and upcoming rides
- **User Profiles**: View user profiles with ratings and statistics

### Secondary Features
- **Driver Approvals**: Drivers can accept or reject booking requests
- **User Ratings**: Rate drivers and view their average ratings
- **Responsive Design**: Mobile-friendly interface
- **Toast Notifications**: Real-time feedback for actions

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - High-quality UI components
- **Zustand** - State management for authentication
- **React Hook Form** - Form validation and handling
- **Zod** - Runtime schema validation
- **Sonner** - Toast notifications
- **Leaflet** - Interactive maps for ride tracking
- **Socket.io** - Real-time location updates

### Backend Integration
- **Axios** - HTTP client for API calls
- **Socket.io Client** - WebSocket for real-time updates

## Project Structure

```
/app
  /login              - Login page
  /register           - Registration page
  /create-ride        - Create new ride form
  /rides/[id]         - Ride details page
  /my-bookings        - User's bookings
  /profile/[id]       - User profile page
  layout.tsx          - Root layout with Navbar
  page.tsx            - Home page with ride listings
  globals.css         - Global styles

/components
  /auth
    LoginForm.tsx
    RegisterForm.tsx
  /rides
    RideCard.tsx
    RideDetail.tsx
    RideMap.tsx
    CreateRideForm.tsx
  /bookings
    MyBookings.tsx
  /profile
    UserProfile.tsx
  Navbar.tsx          - Navigation bar

/lib
  types.ts            - TypeScript interfaces
  schemas.ts          - Zod validation schemas
  api.ts              - API client with axios
  socket.ts           - Socket.io service
  store.ts            - Zustand auth store

/hooks
  useRides.ts         - Custom hooks for ride data
```

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm (or npm/yarn)
- A running backend API server (see API endpoints below)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints (Expected Backend)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Rides
- `GET /api/rides` - List all rides
- `GET /api/rides/:id` - Get ride details
- `POST /api/rides` - Create new ride
- `PUT /api/rides/:id` - Update ride
- `POST /api/rides/:id/cancel` - Cancel ride
- `POST /api/rides/:id/book` - Book a seat
- `GET /api/rides/:id/location` - Get driver location

### Bookings
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/my-ride-requests` - Get ride requests for driver
- `POST /api/rides/:id/passengers/:userId/accept` - Accept booking
- `POST /api/rides/:id/passengers/:userId/reject` - Reject booking

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/rate` - Rate a user

## Socket Events

Real-time events using Socket.io:

### Client → Server
- `driver:location` - Emit driver's current location
- `ride:book-request` - Send booking request

### Server → Client
- `ride:{id}:updated` - Ride information updated
- `ride:{id}:location` - Driver location updated
- `user:{id}:booking-request` - New booking request received

## Authentication Flow

1. User registers with name, email, phone, and password
2. Backend validates and returns user object + JWT token
3. Token stored in localStorage and Zustand store
4. Token automatically included in all API requests
5. Token used for Socket.io authentication
6. Logout clears token and redirects to login

## Development Notes

### Adding Components
- Use `pnpm dlx shadcn@latest add <component>` to add UI components
- All components are in `/components/ui`
- Import and compose components in feature components

### Form Validation
- Use React Hook Form for form handling
- Zod schemas for runtime validation
- Error messages displayed inline

### Real-time Features
- Socket.io initialized on login
- Automatically reconnects on disconnect
- Location tracking updates ride in real-time
- Booking requests push notifications via Socket

### Styling
- Tailwind CSS for responsive design
- Custom theme tokens in globals.css
- Mobile-first approach
- Dark mode support

## Build for Production

```bash
pnpm build
pnpm start
```

## Future Enhancements

- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Advanced search and filtering
- [ ] Review system
- [ ] Recurring rides
- [ ] Admin dashboard
- [ ] Push notifications
- [ ] File uploads for user avatars
- [ ] Accessibility improvements

## License

MIT

## Support

For issues or feature requests, please contact the development team.
