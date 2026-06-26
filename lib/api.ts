// lib/api.ts
import axios, { AxiosError } from 'axios';
import { AuthResponse, User, Ride } from './types';
import {
  LoginInput,
  RegisterInput,
  CreateRideInput,
} from './schemas';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor: প্রতিটি রিকোয়েস্টে টোকেন যোগ করে (যদি থাকে)
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('authToken')
      : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ❌ 401 এরর হ্যান্ডলিং – লগআউট করে লগইন পেজে পাঠায়
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ✅ AUTH API – সম্পূর্ণ সংশোধিত
export const authAPI = {
  // 🔥 লগইন – ব্যাকএন্ড থেকে token + user একসাথে আসে
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    const { token, user } = response.data; // { token, user }

    // টোকেন localStorage-এ সেভ করুন
    localStorage.setItem('authToken', token);

    // ইউজার রিটার্ন করুন (প্রোফাইল কলের দরকার নেই)
    return { token, user };
  },

  // রেজিস্টার
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data; // { token, user }
  },

  // প্রোফাইল (আলাদাভাবে প্রয়োজনে)
  me: async (): Promise<User> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
};

// RIDES API
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

// BOOKINGS API
export const bookingsAPI = {
  create: async (rideId: string) => {
    const response = await apiClient.post('/bookings', { rideId });
    return response.data;
  },

  getMyBookings: async () => {
    const response = await apiClient.get('/bookings/my');
    return response.data;
  },

  acceptBooking: async (bookingId: string): Promise<void> => {
    await apiClient.patch(`/bookings/${bookingId}/accept`);
  },

  rejectBooking: async (bookingId: string): Promise<void> => {
    await apiClient.patch(`/bookings/${bookingId}/reject`);
  },
};

// USERS API
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