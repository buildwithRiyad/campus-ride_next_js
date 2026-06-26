# GPS Tracking & Real-Time Location Implementation Guide

## Overview

The Campus Ride Sharing app now includes **advanced GPS tracking** with support for multiple drivers, smooth animations, accuracy handling, and intelligent update throttling.

## Features Implemented

### 1. **Real-Time GPS Tracking**
- Continuous GPS monitoring using the Geolocation API
- Configurable update intervals (default: 2 seconds)
- Accuracy-based filtering (rejects poor accuracy readings)
- Distance-based throttling (only updates if moved 10m+)

### 2. **Multiple Driver Tracking**
- Support for tracking up to 10 drivers simultaneously on one map
- Unique marker per driver with driver ID display
- Batch update events for efficient network usage
- Deduplication of driver locations by ID

### 3. **Smart Location Updates**
- **Accuracy checking**: Ignores readings with accuracy > 100m
- **Time throttling**: Updates max every 2 seconds
- **Distance filtering**: Only emits if moved > 10 meters
- **Speed calculation**: Tracks movement speed
- **Error recovery**: Handles permission denied, position unavailable, timeout

### 4. **Map Enhancements**
- **Smooth animations**: Pan to driver location with 1-second animation
- **Automatic bounds fitting**: Shows entire route + all drivers
- **Accuracy visualization**: Optional accuracy circles on map
- **Location info panel**: Displays accuracy, speed, timestamp
- **Driver count badge**: Shows number of tracked drivers

## Architecture

### Frontend Files

#### `/lib/socket.ts` - GPS & Real-time Communication
```typescript
// Start GPS tracking
startGPSTracking(rideId, {
  updateInterval: 2000,     // ms between updates
  minAccuracy: 100,         // meters
  minDistance: 10          // meters
})

// Stop GPS tracking
stopGPSTracking()

// Subscribe to single driver location
subscribeToDriverLocation(rideId, (location) => {
  // Handle location update
})

// Subscribe to multiple drivers
subscribeToMultipleDriverLocations(rideId, (locations) => {
  // Handle batch update
})

// Configure GPS parameters
configureGPSTracking({
  updateInterval: 2000,
  minAccuracy: 100,
  minDistance: 10
})
```

#### `/components/rides/RideMap.tsx` - Map Visualization
```typescript
interface RideMapProps {
  departureLocation: Location;
  arrivalLocation: Location;
  driverLocation?: DriverLocation;        // Current driver
  multipleDrivers?: DriverLocation[];     // Other drivers
  enableTracking?: boolean;               // Smooth animation
  showAccuracy?: boolean;                 // Show accuracy info
}
```

Features:
- `MapController` component for smooth animations
- Polyline showing route
- Multiple marker types (green=start, red=end, blue=drivers)
- Accuracy visualization with dashed circles
- Location stats overlay

#### `/components/rides/RideDetail.tsx` - Integration
- Automatically starts GPS tracking if user is driver
- Subscribes to driver location updates
- Cleanup on unmount or role change

### Types (`/lib/types.ts`)

```typescript
interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  accuracy?: number;      // meters
  speed?: number;         // km/h
  timestamp: string;      // ISO timestamp
}
```

## Backend Integration

### Required WebSocket Events

#### **Emit from Frontend**
```typescript
// Driver sends location
socket.emit('driver:location', {
  rideId: string,
  lat: number,
  lng: number,
  accuracy: number,
  speed: number,
  timestamp: string
})
```

#### **Receive on Frontend**

**Single Driver Location** (for ride details page)
```typescript
socket.on('ride:{rideId}:location', (location: DriverLocation) => {
  // Update map with driver location
})
```

**Multiple Drivers Batch** (for ride listing or multi-driver scenarios)
```typescript
socket.on('ride:{rideId}:locations-batch', (locations: DriverLocation[]) => {
  // Update map with all drivers on this ride
})
```

### Backend Responsibilities

1. **Validate Location Data**
   - Verify coordinates are valid (lat: -90 to 90, lng: -180 to 180)
   - Check timestamp is recent (within 30 seconds)
   - Reject outlier positions (jumped 100+ km)

2. **Store Location History**
   - Keep last 100 locations per driver
   - Timestamp all entries
   - Enable route replay/history

3. **Broadcast to Passengers**
   - Send `ride:{rideId}:location` to passengers on ride
   - Or send batch updates: `ride:{rideId}:locations-batch`
   - Debounce if needed (max 1 update per 2 seconds per driver)

4. **Handle Edge Cases**
   - Driver goes offline: Clear watching, notify passengers
   - GPS connection lost: Retry with exponential backoff
   - Invalid locations: Log and skip, don't broadcast
   - Permission denied: Allow driver to manually input location

### Example Backend Implementation (Node.js + Socket.io)

```javascript
io.on('connection', (socket) => {
  socket.on('driver:location', (data) => {
    const { rideId, lat, lng, accuracy, speed, timestamp } = data;
    
    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('Invalid coordinates');
      return;
    }

    // Store in database
    await Location.create({
      rideId,
      driverId: socket.userId,
      lat,
      lng,
      accuracy,
      speed,
      timestamp,
    });

    // Broadcast to passengers
    io.to(`ride:${rideId}:passengers`).emit(
      `ride:${rideId}:location`,
      {
        driverId: socket.userId,
        lat,
        lng,
        accuracy,
        speed,
        timestamp,
      }
    );
  });

  socket.on('disconnect', () => {
    // Mark driver as offline
    console.log(`Driver ${socket.userId} offline`);
  });
});
```

## Usage Examples

### 1. Driver Sharing Location

```typescript
// In RideDetail component - automatically handled
// When driver opens ride detail, GPS tracking starts automatically

// Or manually:
import { startGPSTracking, stopGPSTracking } from '@/lib/socket';

// Start tracking
const rideId = 'ride-123';
startGPSTracking(rideId, {
  updateInterval: 2000,
  minAccuracy: 100,
  minDistance: 10,
});

// Stop when ride ends
stopGPSTracking();
```

### 2. Passenger Viewing Driver Location

```typescript
// In ride details page
const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);

useEffect(() => {
  const unsubscribe = subscribeToDriverLocation(rideId, (location) => {
    setDriverLocation(location);
  });

  return () => unsubscribeFromDriverLocation(rideId);
}, [rideId]);

// Pass to map
<RideMap
  departureLocation={ride.departureLocation}
  arrivalLocation={ride.arrivalLocation}
  driverLocation={driverLocation}
  enableTracking={true}
  showAccuracy={true}
/>
```

### 3. Multiple Drivers on One Map

```typescript
const [allDrivers, setAllDrivers] = useState<DriverLocation[]>([]);

useEffect(() => {
  subscribeToMultipleDriverLocations(rideId, (locations) => {
    setAllDrivers(locations);
  });
}, [rideId]);

<RideMap
  departureLocation={ride.departureLocation}
  arrivalLocation={ride.arrivalLocation}
  multipleDrivers={allDrivers}
  enableTracking={true}
/>
```

## GPS Accuracy Levels

| Accuracy | Level | Action |
|----------|-------|--------|
| < 20m    | High  | Accept, show green circle |
| 20-50m   | Medium| Accept, show orange circle |
| > 50m    | Low   | Accept but warn, show red circle |
| > 100m   | Poor  | Reject (default threshold) |

## Performance Optimizations

### Frontend
1. **Update Throttling**: Max 1 update per 2 seconds per driver
2. **Distance Filtering**: Only emit if moved 10m+ (reduces network traffic)
3. **Marker Deduplication**: Max 10 drivers on map (older ones removed)
4. **Lazy Map Loading**: `dynamic()` import with `ssr: false`

### Backend
1. **Batch Broadcasting**: Send multiple driver locations in one event
2. **Room-based Events**: Only broadcast to active passengers
3. **Location History Limit**: Keep last 100 locations per driver
4. **Rate Limiting**: Max 1 location emit per driver per second

## Security Considerations

1. **Authentication**: All location emissions require valid JWT
2. **Authorization**: Only drivers can emit locations for their rides
3. **Data Validation**: Sanitize all coordinates before storage
4. **Privacy**: Don't expose driver location to non-passengers
5. **Rate Limiting**: Prevent GPS spamming (max 1 per second)
6. **HTTPS Only**: Use secure WebSocket (wss://) in production

## Troubleshooting

### "GPS Accuracy Poor" Warning
- **Cause**: Location accuracy > 100m
- **Solution**: Move to better GPS signal (away from buildings)
- **Backend**: Lower minAccuracy threshold if needed

### Driver Location Not Updating
- **Check**: Is GPS tracking started? `startGPSTracking()` called?
- **Check**: Is socket connected? `getSocket()?.connected`?
- **Check**: Has driver moved > 10m?
- **Check**: Is backend broadcasting to correct room?

### Map Animations Jittery
- **Cause**: Updates too frequent
- **Solution**: Increase `updateInterval` or `minDistance`
- **Backend**: Implement debouncing (1 event per 2 seconds max)

### High Battery Drain
- **Cause**: GPS enabled always + high accuracy mode
- **Solution**: 
  - Increase `updateInterval` (2-5 seconds)
  - Increase `minDistance` (10-50 meters)
  - Reduce accuracy requirement (`minAccuracy: 200`)
  - Stop tracking when ride ends

### WebSocket Connection Drops
- **Frontend**: Automatically reconnects (max 5 attempts)
- **Backend**: Gracefully handle disconnections
- **Solution**: Ensure WebSocket server is stable

## Testing GPS Functionality

### Manual Testing
```bash
# Open browser DevTools > Console

# Test geolocation
navigator.geolocation.getCurrentPosition(
  (pos) => console.log(pos.coords),
  (err) => console.error(err)
)

# Test socket connection
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected!'));
```

### Mock GPS Data (for development)
```typescript
// In socket.ts - uncomment for testing
export const emitMockLocation = (rideId: string) => {
  const locations = [
    { lat: 40.7128, lng: -74.0060 }, // NYC
    { lat: 40.7260, lng: -74.0100 },
    { lat: 40.7300, lng: -74.0140 },
  ];

  let index = 0;
  setInterval(() => {
    const loc = locations[index % locations.length];
    emitDriverLocation(rideId, loc.lat, loc.lng, 25);
    index++;
  }, 2000);
};
```

## Database Schema (Recommended)

```sql
CREATE TABLE driver_locations (
  id UUID PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES rides(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  accuracy FLOAT DEFAULT 50,
  speed FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (ride_id, created_at),
  INDEX (driver_id, created_at)
);

-- Clean up old locations (older than 24 hours)
DELETE FROM driver_locations 
WHERE created_at < NOW() - INTERVAL 24 HOUR;
```

## Next Steps

1. ✅ Frontend: GPS tracking, socket service, map visualization
2. 🔄 **Backend**: Implement location storage, validation, broadcasting
3. 🔄 **Testing**: Load test with 100+ concurrent drivers
4. 🔄 **Optimization**: Implement route optimization (Google Directions API)
5. 🔄 **Features**: ETA calculation, offline mode, route replay

## API Endpoints (To be implemented)

```
GET /api/rides/:rideId/locations          # Get route history
GET /api/rides/:rideId/locations/latest   # Get latest driver location
GET /api/drivers/:driverId/locations      # Get driver's all locations
```

## Resources

- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Leaflet.js](https://leafletjs.com/)
- [Socket.io](https://socket.io/)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
