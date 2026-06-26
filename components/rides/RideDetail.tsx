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
import { MapPin, Clock, Users, Phone } from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const RideMap = dynamic(() => import('./RideMap'), { ssr: false });

interface RideDetailProps {
  ride: Ride;
  onBook?: () => void;
}

export default function RideDetail({ ride, onBook }: RideDetailProps) {
  const { user } = useAuthStore();
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const isDriver = user?.id === ride.creatorId;
  const isPassenger = (ride as any).passengers?.some((p: any) => p.userId === user?.id);
  const hasPendingRequest = (ride as any).passengers?.some(
    (p: any) => p.userId === user?.id && p.status === 'pending'
  );

  // ✅ Effect: init socket, start GPS (if driver), manually listen for location updates
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found');
      return;
    }

    const s = socket.initSocket(String(user.id), token);

    const handleConnect = () => {
      console.log('Socket connected');
      if (isDriver) {
        socket.startGPSTracking(ride.id, {
          updateInterval: 2000,
          minAccuracy: 100,
          minDistance: 10,
        });
      }
    };
    s.on('connect', handleConnect);

    const locationHandler = (location: DriverLocation) => {
      setDriverLocation(location);
    };
    s.on('driver-location-update', locationHandler);

    return () => {
      s.off('connect', handleConnect);
      s.off('driver-location-update', locationHandler);
      if (isDriver) {
        socket.stopGPSTracking();
      }
      socket.closeSocket();
    };
  }, [user, ride.id, isDriver]);

  // Handlers
  const handleBookRide = async () => {
    try {
      setIsBooking(true);
      const s = socket.getSocket();
      if (s) {
        s.emit('ride:book-request', {
          rideId: ride.id,
          userId: user?.id,
        });
      }
      toast.success('Booking request sent!');
      onBook?.();
    } catch (error) {
      toast.error('Failed to book ride');
    } finally {
      setIsBooking(false);
    }
  };

  const handleAcceptPassenger = async (passengerId: string) => {
    try {
      setIsAccepting(true);
      // ✅ FIX: pass a single object with rideId and passengerId
      await bookingsAPI.acceptBooking({ rideId: ride.id, passengerId });
      toast.success('Booking accepted!');
    } catch (error) {
      toast.error('Failed to accept booking');
    } finally {
      setIsAccepting(false);
    }
  };

  const departureDate = new Date(ride.departureTime).toLocaleDateString();
  const departureTime = new Date(ride.departureTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Map */}
      <Card>
        <CardContent className="pt-6">
          <RideMap
            departureLocation={(ride as any).departureLocation}
            arrivalLocation={(ride as any).arrivalLocation}
            driverLocation={driverLocation}
          />
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
                <p className="text-sm text-muted-foreground">
                  {(ride as any).departureLocation?.address}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm font-semibold">Arrival</p>
                <p className="text-sm text-muted-foreground">
                  {(ride as any).arrivalLocation?.address}
                </p>
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
                      onClick={() => handleAcceptPassenger(passenger.userId)}
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