import io, { Socket } from 'socket.io-client';
import { DriverLocation } from './types';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;
let geoWatchId: number | null = null;

/* =========================
   SOCKET INIT
========================= */
export const initSocket = (userId: string, token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(`${SOCKET_URL}/ride`, {
    auth: { token, userId },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('[socket] connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('[socket] disconnected');
    stopGPSTracking();
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const closeSocket = () => {
  stopGPSTracking();
  socket?.disconnect();
  socket = null;
};

/* =========================
   JOIN ROOM  (✅ ADDED / RE‑EXPORTED)
========================= */
export const joinRideRoom = (rideId: string) => {
  socket?.emit('join-ride', { rideId });
};

/* =========================
   EMIT DRIVER LOCATION
========================= */
export const sendDriverLocation = (
  rideId: string,
  lat: number,
  lng: number,
  accuracy = 50,
  speed = 0
) => {
  socket?.emit('driver:location', {
    rideId,
    lat,
    lng,
    accuracy,
    speed,
    timestamp: new Date().toISOString(),
  });
};

/* =========================
   SUBSCRIBE TO LOCATION UPDATES
========================= */
export const subscribeToDriverLocation = (cb: (data: any) => void) => {
  socket?.on('ride:location', cb);
};

export const unsubscribeFromDriverLocation = () => {
  socket?.off('ride:location');
};

/* =========================
   GPS TRACKING
========================= */
interface GPSState {
  lastLocation: DriverLocation | null;
  lastUpdateTime: number;
  updateInterval: number;
  minAccuracy: number;
  minDistance: number;
}

const gpsState: GPSState = {
  lastLocation: null,
  lastUpdateTime: 0,
  updateInterval: 2000,
  minAccuracy: 100,
  minDistance: 10,
};

export const startGPSTracking = (
  rideId: string,
  options?: {
    updateInterval?: number;
    minAccuracy?: number;
    minDistance?: number;
  }
) => {
  if (!socket) return console.error('Socket not initialized');
  if (geoWatchId !== null) return;

  if (options) {
    gpsState.updateInterval = options.updateInterval ?? gpsState.updateInterval;
    gpsState.minAccuracy = options.minAccuracy ?? gpsState.minAccuracy;
    gpsState.minDistance = options.minDistance ?? gpsState.minDistance;
  }

  geoWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy, speed } = pos.coords;
      const now = Date.now();

      if (accuracy > gpsState.minAccuracy) return;
      if (now - gpsState.lastUpdateTime < gpsState.updateInterval) return;

      if (gpsState.lastLocation) {
        const dist = calculateDistance(
          gpsState.lastLocation.lat,
          gpsState.lastLocation.lng,
          latitude,
          longitude
        );
        if (dist < gpsState.minDistance) return;
      }

      gpsState.lastLocation = {
        driverId: 'current',
        lat: latitude,
        lng: longitude,
        accuracy,
        speed: speed || 0,
        timestamp: new Date().toISOString(),
      };

      gpsState.lastUpdateTime = now;

      socket?.emit('driver:location', {
        rideId,
        lat: latitude,
        lng: longitude,
        accuracy,
        speed: speed || 0,
      });
    },
    (err) => console.error('[gps]', err.message),
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
  }
};

/* =========================
   DISTANCE HELPER
========================= */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* =========================
   LOCATION SEARCH (Nominatim)
========================= */
export interface SearchResult {
  address: string;
  lat: number;
  lng: number;
}

export async function searchLocation(
  query: string
): Promise<SearchResult[]> {
  if (!query || query.length < 3) return [];

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=jsonv2&limit=5`
  );

  const data = await res.json();

  return data.map((item: any) => ({
    address: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}