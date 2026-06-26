// lib/api.ts
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
};

// ==================== BOOKINGS ====================
export const bookingsAPI = {
  // Create a new booking (passenger requests a seat)
  createBooking: async (rideId: string) => {
    const response = await apiClient.post('/bookings', { rideId });
    return response.data;
  },

  // Get all bookings for the current user (passenger or driver)
  getMyBookings: async () => {
    const response = await apiClient.get('/bookings/my');
    return response.data;
  },

  // Accept a booking (driver only)
  acceptBooking: async (bookingId: string) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/accept`);
    return response.data;
  },

  // Reject a booking (driver only)
  rejectBooking: async (bookingId: string) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/reject`);
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

export default apiClient;