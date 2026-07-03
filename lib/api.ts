import axios, { AxiosError } from 'axios';
import { AuthResponse, User, Ride } from './types';
import { LoginInput, RegisterInput, CreateRideInput } from './schemas';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    const { token, user } = response.data;
    localStorage.setItem('authToken', token);
    return { token, user };
  },
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  me: async (): Promise<User> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
};

// ==================== RIDES ====================
export const ridesAPI = {
  getAll: async (): Promise<Ride[]> => {
    const response = await apiClient.get('/rides');
    return response.data;
  },
  getById: async (id: string): Promise<Ride> => {
    const response = await apiClient.get(`/rides/${id}`);
    return response.data;
  },
  create: async (data: CreateRideInput): Promise<Ride> => {
    const response = await apiClient.post('/rides', data);
    return response.data;
  },
  getMyRides: async () => {
    const response = await apiClient.get('/rides/my');
    return response.data;
  },
};

// ==================== BOOKINGS ====================
export const bookingsAPI = {
  createBooking: async (rideId: string) => {
    const response = await apiClient.post('/bookings', { rideId });
    return response.data;
  },
  getMyBookings: async () => {
    const response = await apiClient.get('/bookings/my');
    return response.data;
  },
  acceptBooking: async (bookingId: string) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/accept`);
    return response.data;
  },
  rejectBooking: async (bookingId: string) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/reject`);
    return response.data;
  },
  confirmBooking: async (bookingId: string) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/confirm`);
    return response.data;
  },
  getBookingsForRide: async (rideId: string) => {
    const response = await apiClient.get(`/bookings/ride/${rideId}`);
    return response.data;
  },
};

// ==================== USERS ====================
export const usersAPI = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
  updateMe: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch('/users/me', data);
    return response.data;
  },
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },
};

// ==================== CHAT (Correct Backend Endpoints) ====================
export const chatAPI = {
  /**
   * Get paginated chat history for a ride
   * GET /chats/ride/:rideId?page=1&limit=50
   */
  getChatHistory: async (rideId: string, page = 1, limit = 50) => {
    const response = await apiClient.get(`/chats/ride/${rideId}`, {
      params: { page, limit },
    });
    return response.data; // { items, total, page, limit, totalPages }
  },

  /**
   * Alias for getChatHistory (used by ChatWindow)
   */
  getRideHistory: async (rideId: string, page = 1, limit = 50) => {
    return chatAPI.getChatHistory(rideId, page, limit);
  },

  /**
   * Upload an image for chat messages
   * POST /chats/upload
   */
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/chats/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { url: string }
  },

  // ---- Optional / Future endpoints (may require backend implementation) ----

  /**
   * Get direct message history with a specific user
   * GET /chat/direct/:userId?page=1&limit=50
   * (Not yet implemented in backend – placeholder)
   */
  getDirectHistory: async (userId: string, page = 1, limit = 50) => {
    const response = await apiClient.get(`/chat/direct/${userId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get total unread message count
   * GET /chat/unread (Not yet implemented – placeholder)
   */
  getUnreadCount: async () => {
    const response = await apiClient.get('/chat/unread');
    return response.data.unread;
  },

  /**
   * Mark a specific message as read
   * PATCH /chat/read/:messageId (Not yet implemented – placeholder)
   */
  markAsRead: async (messageId: string) => {
    await apiClient.patch(`/chat/read/${messageId}`);
  },
};

export default apiClient;