# RideShare Backend Setup Guide

This guide explains how to set up the backend API server for the RideShare application. The frontend is built and ready, so you need to create a backend that implements the API endpoints described below.

## Backend Requirements

### Technology Stack (Recommended)
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **PostgreSQL** - Database
- **JWT** - Authentication tokens
- **Mongoose or TypeORM** - Database ORM

### Alternative Stacks
- **Python** - Django, FastAPI, Flask
- **Go** - Gin, Echo
- **.NET** - ASP.NET Core
- **Java** - Spring Boot

## API Endpoints to Implement

### 1. Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123"
}

Response 201:
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "avatar": null,
    "rating": 0,
    "totalRides": 0,
    "createdAt": "2025-06-26T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response 200:
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer {token}

Response 200:
{
  "id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "avatar": null,
  "rating": 5.0,
  "totalRides": 10,
  "createdAt": "2025-06-26T10:00:00Z"
}
```

#### Logout User
```
POST /api/auth/logout
Authorization: Bearer {token}

Response 200:
{
  "message": "Logged out successfully"
}
```

### 2. Rides Endpoints

#### List All Rides
```
GET /api/rides?status=scheduled&driverId=driver_123
Authorization: Bearer {token}

Response 200:
{
  "rides": [
    {
      "id": "ride_123",
      "driverId": "driver_456",
      "driver": { ... },
      "departureLocation": {
        "lat": 40.7128,
        "lng": -74.0060,
        "address": "123 Main St, New York, NY"
      },
      "arrivalLocation": {
        "lat": 40.7489,
        "lng": -73.9680,
        "address": "456 Park Ave, New York, NY"
      },
      "departureTime": "2025-06-26T14:00:00Z",
      "arrivalTime": null,
      "seatsAvailable": 3,
      "pricePerSeat": 5.00,
      "description": "Direct route, stops at transit hub",
      "status": "scheduled",
      "passengers": [
        {
          "userId": "user_123",
          "user": { ... },
          "status": "accepted",
          "joinedAt": "2025-06-26T10:30:00Z"
        }
      ],
      "createdAt": "2025-06-26T10:00:00Z"
    }
  ]
}
```

#### Get Ride Details
```
GET /api/rides/{rideId}
Authorization: Bearer {token}

Response 200:
{ ... ride object ... }
```

#### Create Ride
```
POST /api/rides
Authorization: Bearer {token}
Content-Type: application/json

{
  "departureAddress": "123 Main St, New York, NY",
  "departureTime": "2025-06-26T14:00:00Z",
  "arrivalAddress": "456 Park Ave, New York, NY",
  "seatsAvailable": 4,
  "pricePerSeat": 5.00,
  "description": "Direct route"
}

Response 201:
{ ... ride object ... }
```

#### Book a Ride
```
POST /api/rides/{rideId}/book
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Going to meeting"
}

Response 200:
{
  "bookingId": "booking_123"
}
```

#### Accept Booking Request
```
POST /api/rides/{rideId}/passengers/{userId}/accept
Authorization: Bearer {token}

Response 200:
{
  "message": "Booking accepted"
}
```

#### Reject Booking Request
```
POST /api/rides/{rideId}/passengers/{userId}/reject
Authorization: Bearer {token}

Response 200:
{
  "message": "Booking rejected"
}
```

#### Update Driver Location
```
POST /api/rides/{rideId}/location
Authorization: Bearer {token}
Content-Type: application/json

{
  "lat": 40.7200,
  "lng": -74.0080
}

Response 200:
{
  "message": "Location updated"
}
```

#### Get Driver Location
```
GET /api/rides/{rideId}/location
Authorization: Bearer {token}

Response 200:
{
  "driverId": "driver_456",
  "lat": 40.7200,
  "lng": -74.0080,
  "timestamp": "2025-06-26T14:05:00Z"
}
```

### 3. Bookings Endpoints

#### Get User's Bookings
```
GET /api/bookings/my-bookings
Authorization: Bearer {token}

Response 200:
{
  "rides": [ ... ]
}
```

#### Get Ride Requests (for Driver)
```
GET /api/bookings/my-ride-requests
Authorization: Bearer {token}

Response 200:
{
  "passengers": [ ... ]
}
```

### 4. Users Endpoints

#### Get User Profile
```
GET /api/users/{userId}
Authorization: Bearer {token}

Response 200:
{
  "id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "avatar": "https://...",
  "rating": 4.8,
  "totalRides": 15,
  "createdAt": "2025-06-26T10:00:00Z"
}
```

#### Rate a User
```
POST /api/users/{userId}/rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,
  "review": "Great driver!"
}

Response 200:
{
  "message": "Rating submitted"
}
```

## Socket.io Events

### Authentication
```javascript
io.on('connection', (socket) => {
  // Client sends auth on connect
  socket.on('auth', { token: 'jwt_token' });
});
```

### Emitting Events (Server → Client)

#### Ride Updated
```javascript
socket.emit(`ride:${rideId}:updated`, {
  id: 'ride_123',
  status: 'in-progress',
  passengers: [ ... ]
});
```

#### Driver Location Updated
```javascript
socket.emit(`ride:${rideId}:location`, {
  driverId: 'driver_456',
  lat: 40.7200,
  lng: -74.0080,
  timestamp: '2025-06-26T14:05:00Z'
});
```

#### Booking Request Received
```javascript
socket.emit(`user:${userId}:booking-request`, {
  rideId: 'ride_123',
  userId: 'user_789',
  user: { name: 'Jane Smith', avatar: '...' },
  timestamp: '2025-06-26T14:10:00Z'
});
```

### Listening for Events (Client → Server)

#### Driver Location Update
```javascript
socket.on('driver:location', { rideId, lat, lng });
```

#### Ride Booking Request
```javascript
socket.on('ride:book-request', { rideId, userId });
```

## Database Schema (Recommended)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  rating DECIMAL(3,2) DEFAULT 0,
  total_rides INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rides Table
```sql
CREATE TABLE rides (
  id UUID PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES users(id),
  departure_address VARCHAR(255) NOT NULL,
  departure_lat DECIMAL(10,8) NOT NULL,
  departure_lng DECIMAL(11,8) NOT NULL,
  arrival_address VARCHAR(255) NOT NULL,
  arrival_lat DECIMAL(10,8) NOT NULL,
  arrival_lng DECIMAL(11,8) NOT NULL,
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP,
  seats_available INT NOT NULL,
  price_per_seat DECIMAL(10,2) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Passengers Table (Many-to-Many)
```sql
CREATE TABLE passengers (
  id UUID PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES rides(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ride_id, user_id)
);
```

### Ratings Table
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  ride_id UUID NOT NULL REFERENCES rides(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Driver Locations Table
```sql
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES rides(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Considerations

1. **JWT Validation** - Always validate JWT tokens on protected endpoints
2. **Password Hashing** - Use bcrypt or similar for password hashing
3. **CORS** - Configure CORS to allow requests from frontend origin
4. **Rate Limiting** - Implement rate limiting on auth endpoints
5. **Input Validation** - Validate all input data
6. **HTTPS** - Use HTTPS in production
7. **Error Handling** - Don't expose sensitive error details

## Environment Variables (Backend)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/rideshare
JWT_SECRET=your-secret-key-change-this
NODE_ENV=development
PORT=3001
SOCKET_PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Running the Application

1. Start the backend API server on `http://localhost:3001`
2. Start the frontend on `http://localhost:3000` (with `pnpm dev`)
3. Both should communicate via the API and WebSocket

## Testing the API

Use tools like:
- **Postman** - GUI for API testing
- **curl** - Command line tool
- **Thunder Client** - VSCode extension
- **REST Client** - VSCode extension

Example with curl:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "password": "password123"
  }'
```

## Troubleshooting

- **CORS Error**: Make sure backend CORS is configured for frontend origin
- **Connection Refused**: Verify backend server is running on correct port
- **Token Not Working**: Check JWT_SECRET matches between frontend and backend
- **Socket Connection Failed**: Verify Socket.io is enabled and port is accessible

---

For more information, refer to the README.md file in the project root.
