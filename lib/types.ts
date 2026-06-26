export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  studentId: string;
  department?: string;
  university: string;
  profileImage?: string;
  isVerified: boolean;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Ride {
  id: string;

  fromLocation: string;
  toLocation: string;

  departureTime: string;

  vehicleType: 'CAR' | 'BIKE' | 'RICKSHAW' | 'CNG';

  availableSeats: number;

  pricePerSeat: number;

  note?: string;

  status: 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED';

  creatorId: number;

  creator: User;

  createdAt: string;
  updatedAt: string;
}

export interface Passenger {
  userId: string;
  user: User;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  joinedAt: string;
}

export interface BookingRequest {
  id: string;
  rideId: string;
  userId: string;
  user: User;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
}

export interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
