import io, { Socket } from 'socket.io-client';
import { DriverLocation } from './types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;
let geoWatchId: number | null = null;

// GPS tracking state
interface GPSState {
  lastLocation: DriverLocation | null;
  lastUpdateTime: number;
  updateInterval: number; // milliseconds between updates
  minAccuracy: number; // reject if accuracy worse than this
  minDistance: number; // minimum distance change to trigger update (meters)
}

const gpsState: GPSState = {
  lastLocation: null,
  lastUpdateTime: 0,
  updateInterval: 2000, // Default: update every 2 seconds
  minAccuracy: 100, // meters
  minDistance: 10, // meters
};

export const initSocket = (userId: string, token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
      userId,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[v0] Socket connected:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('[v0] Socket disconnected');
    stopGPSTracking();
  });

  socket.on('error', (error) => {
    console.error('[v0] Socket error:', error);
  });

  return socket;
};

export const closeSocket = () => {
  stopGPSTracking();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

// GPS Tracking Functions
export const startGPSTracking = (
  rideId: string,
  options?: {
    updateInterval?: number;
    minAccuracy?: number;
    minDistance?: number;
  }
) => {
  if (!socket) {
    console.error('[v0] Socket not initialized');
    return;
  }

  if (geoWatchId !== null) {
    console.log('[v0] GPS tracking already active');
    return;
  }

  // Update GPS state options
  if (options?.updateInterval) gpsState.updateInterval = options.updateInterval;
  if (options?.minAccuracy) gpsState.minAccuracy = options.minAccuracy;
  if (options?.minDistance) gpsState.minDistance = options.minDistance;

  if (!navigator.geolocation) {
    console.error('[v0] Geolocation API not supported');
    return;
  }

  console.log('[v0] Starting GPS tracking for ride:', rideId);

  geoWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy, speed } = position.coords;
      const now = Date.now();

      // Check if accuracy is acceptable
      if (accuracy > gpsState.minAccuracy) {
        console.warn('[v0] GPS accuracy poor:', accuracy.toFixed(0), 'm');
      }

      // Check if enough time has passed since last update
      if (now - gpsState.lastUpdateTime < gpsState.updateInterval) {
        return;
      }

      // Check if distance moved is significant enough
      if (gpsState.lastLocation) {
        const distance = calculateDistance(
          gpsState.lastLocation.lat,
          gpsState.lastLocation.lng,
          latitude,
          longitude
        );

        if (distance < gpsState.minDistance) {
          return; // Not enough movement
        }
      }

      // Update location
      const location: DriverLocation = {
        driverId: 'current', // Will be set by backend
        lat: latitude,
        lng: longitude,
        accuracy,
        speed: speed || 0,
        timestamp: new Date().toISOString(),
      };

      gpsState.lastLocation = location;
      gpsState.lastUpdateTime = now;

      // Emit to server with error handling
      socket?.emit('driver:location', { rideId, ...location }, (error: any) => {
        if (error) {
          console.error('[v0] Failed to emit location:', error);
        }
      });
    },
    (error) => {
      console.error('[v0] GPS error:', error.message);
      // Handle specific error codes
      switch (error.code) {
        case error.PERMISSION_DENIED:
          console.error('[v0] Location permission denied');
          break;
        case error.POSITION_UNAVAILABLE:
          console.error('[v0] Position unavailable');
          break;
        case error.TIMEOUT:
          console.warn('[v0] GPS position timeout');
          break;
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    }
  );
};

export const stopGPSTracking = () => {
  if (geoWatchId !== null) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
    console.log('[v0] GPS tracking stopped');
  }
};

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Real-time updates
export const subscribeToRideUpdates = (rideId: string, callback: (data: any) => void) => {
  if (!socket) return;
  socket.on(`ride:${rideId}:updated`, callback);
};

export const unsubscribeFromRideUpdates = (rideId: string) => {
  if (!socket) return;
  socket.off(`ride:${rideId}:updated`);
};

export const subscribeToDriverLocation = (rideId: string, callback: (location: DriverLocation) => void) => {
  if (!socket) return;
  socket.on(`ride:${rideId}:location`, callback);
};

export const unsubscribeFromDriverLocation = (rideId: string) => {
  if (!socket) return;
  socket.off(`ride:${rideId}:location`);
};

// Subscribe to multiple drivers on a ride
export const subscribeToMultipleDriverLocations = (
  rideId: string,
  callback: (locations: DriverLocation[]) => void
) => {
  if (!socket) return;
  socket.on(`ride:${rideId}:locations-batch`, callback);
};

export const unsubscribeFromMultipleDriverLocations = (rideId: string) => {
  if (!socket) return;
  socket.off(`ride:${rideId}:locations-batch`);
};

export const subscribeToBookingRequests = (userId: string, callback: (data: any) => void) => {
  if (!socket) return;
  socket.on(`user:${userId}:booking-request`, callback);
};

export const unsubscribeFromBookingRequests = (userId: string) => {
  if (!socket) return;
  socket.off(`user:${userId}:booking-request`);
};

// Manual location emission (one-off)
export const emitDriverLocation = (rideId: string, lat: number, lng: number, accuracy?: number) => {
  if (!socket) return;
  socket.emit('driver:location', {
    rideId,
    lat,
    lng,
    accuracy: accuracy || 50,
    speed: 0,
    timestamp: new Date().toISOString(),
  });
};

// Configure GPS tracking options
export const configureGPSTracking = (options: {
  updateInterval?: number;
  minAccuracy?: number;
  minDistance?: number;
}) => {
  if (options.updateInterval) gpsState.updateInterval = options.updateInterval;
  if (options.minAccuracy) gpsState.minAccuracy = options.minAccuracy;
  if (options.minDistance) gpsState.minDistance = options.minDistance;
  console.log('[v0] GPS config updated:', gpsState);
};

// Get current GPS state
export const getGPSState = (): GPSState => {
  return { ...gpsState };
};
