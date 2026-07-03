import { io, Socket } from 'socket.io-client';
import { DriverLocation } from './types';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// ---- Ride Socket ----
let socket: Socket | null = null;
let geoWatchId: number | null = null;

// ---- Chat Socket ----
let chatSocket: Socket | null = null;
let chatSocketToken: string | null = null;

/* =========================
   RIDE SOCKET – INIT, CLOSE, JOIN, LOCATION
========================= */
export const connectSocket = (userId: number): Socket => {
  if (socket?.connected) return socket;

  socket = io(`${SOCKET_URL}/ride`, {
    query: { userId: String(userId) },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('[socket] connected:', socket?.id);
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

export const joinRideRoom = (rideId: string) => {
  socket?.emit('join-ride', { rideId });
};

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
  if (!socket) {
    console.error('Socket not initialized');
    return;
  }
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

/* =========================
   CHAT SOCKET – JWT AUTH (Socket.IO v4)
========================= */
/**
 * Connect to the chat socket with JWT authentication.
 * Returns null if no token is present or connection fails.
 * Sends token both in `auth` (standard) and `query` (fallback).
 */
export const connectChatSocket = (userId: number): Socket | null => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  if (!token) {
    console.warn('[chat socket] missing auth token, skipping connection');
    return null;
  }

  console.log(`[chat socket] token (first 20 chars): ${token.substring(0, 20)}...`);

  // Reuse existing connection if same token and connected
  if (chatSocket?.connected && chatSocketToken === token) {
    return chatSocket;
  }

  // Clean up previous socket
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
    chatSocketToken = null;
  }

  chatSocketToken = token;

  // Send token in both `auth` and `query` for compatibility
  chatSocket = io(`${SOCKET_URL}/chat`, {
    auth: { token },
    query: { token },
    transports: ['websocket'],
  });

  chatSocket.on('connect', () => {
    console.log(`[chat socket] connected (user: ${userId})`);
  });

  chatSocket.on('disconnect', () => {
    console.log('[chat socket] disconnected');
  });

  chatSocket.on('connect_error', (err) => {
    console.error('[chat socket] connect_error:', err.message);
  });

  chatSocket.on('exception', (err) => {
    console.error('[chat socket] exception:', JSON.stringify(err, null, 2));
  });

  return chatSocket;
};

export const getChatSocket = (): Socket | null => chatSocket;

export const closeChatSocket = () => {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
    chatSocketToken = null;
    console.log('[chat socket] closed manually');
  }
};

/* =========================
   CHAT SOCKET – ROOM JOINING
========================= */
export const joinChatRoom = (rideId: string) => {
  if (!chatSocket?.connected) {
    console.warn('[chat socket] not connected, cannot join room');
    return;
  }
  chatSocket.emit('joinChat', { rideId });
};

export const joinDirectRoom = (otherUserId: string) => {
  if (!chatSocket?.connected) {
    console.warn('[chat socket] not connected, cannot join direct room');
    return;
  }
  chatSocket.emit('joinDirect', { otherUserId });
};

/* =========================
   CHAT SOCKET – SEND MESSAGES
========================= */
/**
 * Send a chat message (ride or direct).
 * Use `rideId` for ride chat, `receiverId` for direct chat.
 */
export const sendChatMessage = (payload: {
  rideId?: string;
  receiverId?: string;
  content: string;
  type?: 'text' | 'image';
}) => {
  if (!chatSocket?.connected) {
    console.warn('[chat socket] not connected, cannot send message');
    return;
  }
  chatSocket.emit('sendMessage', payload);
};

/**
 * Legacy alias for direct message (kept for backward compatibility).
 * Prefer using sendChatMessage({ receiverId, content, type }).
 */
export const sendDirectMessage = (
  receiverId: string,
  content: string,
  type: 'text' | 'image' = 'text'
) => {
  sendChatMessage({ receiverId, content, type });
};

/**
 * Send typing indicator (ride or direct).
 * Use `rideId` for ride chat, `receiverId` for direct chat.
 */
export const sendTyping = (payload: {
  rideId?: string;
  receiverId?: string;
  isTyping: boolean;
}) => {
  if (!chatSocket?.connected) return;
  chatSocket.emit('typing', payload);
};

/* =========================
   CHAT SOCKET – SUBSCRIBERS
========================= */
export const subscribeToChatMessages = (cb: (message: any) => void) => {
  chatSocket?.on('newMessage', cb);
};

export const unsubscribeFromChatMessages = () => {
  chatSocket?.off('newMessage');
};

export const subscribeToJoinedChat = (cb: (data: any) => void) => {
  chatSocket?.on('joinedChat', cb);
};

export const unsubscribeFromJoinedChat = () => {
  chatSocket?.off('joinedChat');
};

export const subscribeToJoinedDirect = (cb: (data: any) => void) => {
  chatSocket?.on('joinedDirect', cb);
};

export const unsubscribeFromJoinedDirect = () => {
  chatSocket?.off('joinedDirect');
};