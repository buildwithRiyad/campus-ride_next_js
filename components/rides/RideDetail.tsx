'use client';

import { useEffect, useState } from 'react';
import { Ride, DriverLocation } from '@/lib/types';
import { useAuthStore } from '@/lib/store';
import { bookingsAPI } from '@/lib/api';
import * as socket from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const RideMap = dynamic(() => import('./RideMap'), { ssr: false });

interface RideDetailProps {
  ride: Ride;
  onBook?: () => void;
}

// Geocoding function (optional, for fallback)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address) return null;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export default function RideDetail({ ride, onBook }: RideDetailProps) {
  // Guard – ride না থাকলে লোডিং দেখান
  if (!ride) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        <p className="mt-2 text-sm text-muted-foreground">Loading ride details...</p>
      </div>
    );
  }

  const { user } = useAuthStore();
  const [allLocations, setAllLocations] = useState<DriverLocation[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const isDriver = user?.id === ride.creatorId;
  const isPassenger = (ride as any).passengers?.some((p: any) => p.userId === user?.id);
  const isPartOfRide = isDriver || isPassenger;
  const hasPendingRequest = (ride as any).passengers?.some(
    (p: any) => p.userId === user?.id && p.status === 'pending'
  );

  // State for geocoded coordinates (fallback)
  const [departureCoords, setDepartureCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [arrivalCoords, setArrivalCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(false);

  // Debug logs
  useEffect(() => {
    console.log('RIDE =>', ride);
  }, [ride]);

  useEffect(() => {
    console.log('ALL LOCATIONS =>', allLocations);
  }, [allLocations]);

  // Geocode addresses if coordinates are missing
  useEffect(() => {
    const hasFromCoords = (ride as any).fromLat && (ride as any).fromLng;
    const hasToCoords = (ride as any).toLat && (ride as any).toLng;

    if (hasFromCoords && hasToCoords) {
      setDepartureCoords({
        lat: Number((ride as any).fromLat),
        lng: Number((ride as any).fromLng),
      });
      setArrivalCoords({
        lat: Number((ride as any).toLat),
        lng: Number((ride as any).toLng),
      });
      setGeocodeError(false);
      return;
    }

    const geocode = async () => {
      setGeocoding(true);
      setGeocodeError(false);
      const fromPromise = geocodeAddress(ride.fromLocation);
      const toPromise = geocodeAddress(ride.toLocation);
      const [fromResult, toResult] = await Promise.all([fromPromise, toPromise]);
      if (fromResult && toResult) {
        setDepartureCoords(fromResult);
        setArrivalCoords(toResult);
      } else {
        setGeocodeError(true);
      }
      setGeocoding(false);
    };
    geocode();
  }, [ride.fromLocation, ride.toLocation, ride]);

  // Socket – সবাই লোকেশন পাঠায় ও পায়
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    const s = socket.initSocket(String(user.id), token);

    const onConnect = () => {
      console.log('✅ CONNECTED');
      socket.joinRideRoom(ride.id);
      if (isPartOfRide) {
        socket.startGPSTracking(ride.id);
      }
    };

    s.on('connect', onConnect);

    socket.subscribeToDriverLocation((location: any) => {
      console.log('📍 LOCATION RECEIVED from', location.driverId || 'unknown', location);
      const driverId = location.driverId || location.userId || 'unknown';
      setAllLocations((prev) => {
        const existing = prev.findIndex((l) => l.driverId === driverId);
        const newLoc = { ...location, driverId };
        if (existing !== -1) {
          const updated = [...prev];
          updated[existing] = newLoc;
          return updated;
        } else {
          return [...prev, newLoc];
        }
      });
    });

    return () => {
      s.off('connect', onConnect);
      socket.unsubscribeFromDriverLocation();
      if (isPartOfRide) {
        socket.stopGPSTracking();
      }
      socket.closeSocket();
    };
  }, [user, ride.id, isPartOfRide]);

  // ============================================================
  // 🔧 UPDATED: Book ride using API + optional socket event
  // ============================================================
  const handleBookRide = async () => {
    try {
      setIsBooking(true);

      // 1. API call to create booking in database
      await bookingsAPI.createBooking(ride.id);
      toast.success('Booking request sent!');

      // 2. (Optional) Emit socket event for real-time notification
      const s = socket.getSocket();
      if (s) {
        s.emit('ride:book-request', {
          rideId: ride.id,
          userId: user?.id,
        });
      }

      onBook?.();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to book ride';
      toast.error(message);
    } finally {
      setIsBooking(false);
    }
  };

  // ============================================================
  // 🔧 UPDATED: Accept passenger using booking ID
  // ============================================================
  const handleAcceptPassenger = async (bookingId: string) => {
    try {
      setIsAccepting(true);
      // API call with booking ID (not passengerId)
      await bookingsAPI.acceptBooking(bookingId);
      toast.success('Booking accepted!');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to accept booking';
      toast.error(message);
    } finally {
      setIsAccepting(false);
    }
  };

  const departureDate = new Date(ride.departureTime).toLocaleDateString();
  const departureTime = new Date(ride.departureTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hasCoords = departureCoords && arrivalCoords && !geocoding;
  const driverLoc = allLocations.find((l) => l.driverId === String(ride.creatorId));

  return (
    <div className="space-y-6">
      {/* Map or location details */}
      <Card>
        <CardContent className="pt-6">
          {geocoding ? (
            <div className="h-96 flex flex-col items-center justify-center border rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Loading map...</p>
            </div>
          ) : hasCoords ? (
            <RideMap
              departureLocation={{
                lat: departureCoords!.lat,
                lng: departureCoords!.lng,
                address: ride.fromLocation,
              }}
              arrivalLocation={{
                lat: arrivalCoords!.lat,
                lng: arrivalCoords!.lng,
                address: ride.toLocation,
              }}
              driverLocation={driverLoc || null}
              multipleDrivers={allLocations}
            />
          ) : (
            <div className="h-96 flex flex-col items-center justify-center border rounded-lg p-4">
              <p className="text-muted-foreground mb-3 text-sm">📍 Location details</p>
              <div className="flex flex-col gap-3 text-left w-full max-w-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Departure</p>
                    <p className="text-sm text-muted-foreground">{ride.fromLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Arrival</p>
                    <p className="text-sm text-muted-foreground">{ride.toLocation}</p>
                  </div>
                </div>
                {geocodeError && (
                  <p className="text-xs text-destructive mt-2">
                    Could not load map – showing locations instead.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Details */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm font-semibold">Departure</p>
                <p className="text-sm text-muted-foreground">{ride.fromLocation}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm font-semibold">Arrival</p>
                <p className="text-sm text-muted-foreground">{ride.toLocation}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">{departureTime}</p>
                <p className="text-xs text-muted-foreground">{departureDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold">
                {ride.availableSeats} seats available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Info */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <div className="flex gap-3">
              <Avatar className="size-12">
                <AvatarImage src={ride.creator.profileImage} />
                <AvatarFallback>{ride.creator.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{ride.creator.name}</p>
                <p className="text-sm text-muted-foreground">
                  ⭐ {ride.creator.rating?.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                ${ride.pricePerSeat}
              </p>
              <p className="text-xs text-muted-foreground">per seat</p>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{ride.creator.phone}</p>
          </div>
        </CardContent>
      </Card>

      {/* Passengers / Booking Requests (driver only) */}
      {(ride as any).passengers?.length > 0 && isDriver && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Requests & Passengers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(ride as any).passengers.map((passenger: any) => (
                <div
                  key={passenger.userId}
                  className="flex justify-between p-3 border rounded-lg"
                >
                  <div className="flex gap-3">
                    <Avatar className="size-10">
                      <AvatarImage src={passenger.user.avatar} />
                      <AvatarFallback>{passenger.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{passenger.user.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {passenger.status}
                      </Badge>
                    </div>
                  </div>
                  {passenger.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleAcceptPassenger(passenger.bookingId)} // ✅ now using bookingId
                      disabled={isAccepting}
                    >
                      Accept
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      {!isDriver && !isPassenger && !hasPendingRequest && (
        <Button
          className="w-full"
          size="lg"
          onClick={handleBookRide}
          disabled={isBooking || ride.availableSeats === 0}
        >
          {isBooking ? 'Booking...' : 'Book This Ride'}
        </Button>
      )}
    </div>
  );
}