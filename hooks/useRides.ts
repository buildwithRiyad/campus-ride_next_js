'use client';

import { useState, useEffect } from 'react';
import { Ride } from '@/lib/types';
import { ridesAPI } from '@/lib/api';
import { toast } from 'sonner';

export const useRides = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        setIsLoading(true);

        const data = await ridesAPI.getAll(); // ✅ FIXED

        setRides(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch rides');
        toast.error('Failed to fetch rides');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRides();
  }, []);

  return { rides, isLoading, error, setRides };
};

export const useRide = (rideId: string) => {
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        setIsLoading(true);

        const data = await ridesAPI.getById(rideId);

        setRide(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch ride');
        toast.error('Failed to fetch ride details');
      } finally {
        setIsLoading(false);
      }
    };

    if (rideId) fetchRide(); // safety check
  }, [rideId]);

  return { ride, isLoading, error, setRide };
};

export const useMyBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);

        const data = await ridesAPI.getAll(); // ⚠️ temporary fix (API mismatch)

        setBookings(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch bookings');
        toast.error('Failed to fetch bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return { bookings, isLoading, error, setBookings };
};