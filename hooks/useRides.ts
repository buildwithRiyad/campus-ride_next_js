// hooks/useRides.ts
import { useState, useEffect, useCallback } from 'react';
import { Ride } from '@/lib/types';
import { ridesAPI, bookingsAPI } from '@/lib/api';
import { toast } from 'sonner';

export const useRides = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRides = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ridesAPI.getAll();
      setRides(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rides');
      toast.error('Failed to fetch rides');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  return { rides, isLoading, error, setRides, refresh: fetchRides };
};

export const useRide = (rideId: string) => {
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRide = useCallback(async () => {
    if (!rideId) return;
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
  }, [rideId]);

  useEffect(() => {
    fetchRide();
  }, [fetchRide]);

  return { ride, isLoading, error, setRide, refresh: fetchRide };
};

export const useMyBookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await bookingsAPI.getMyBookings();
      setBookings(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
      toast.error('Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { bookings, isLoading, error, setBookings, refresh: fetchBookings };
};