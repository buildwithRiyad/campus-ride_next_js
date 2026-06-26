'use client';

import { useEffect, useState } from 'react';
import { bookingsAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

type BookingStatus = 'pending' | 'accepted' | 'rejected';

// ✅ Type based on actual backend response
interface Booking {
  id: string;
  status: BookingStatus;
  createdAt: string;
  ride: {
    id: string;
    departureTime: string;
    pricePerSeat: number;
    status: string;
    departureLocation?: { address: string; lat?: number; lng?: number };
    arrivalLocation?: { address: string; lat?: number; lng?: number };
    creator: {
      id: number;
      name: string;
      avatar?: string | null;
      rating?: number | null;
    };
  };
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await bookingsAPI.getMyBookings();
        setBookings(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load bookings';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Loading skeletons
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive mb-4">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">You haven't booked any rides yet.</p>
          <Link href="/" className="text-primary hover:underline">
            Browse available rides →
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      {bookings.map((booking) => {
        const ride = booking.ride;
        const departureTime = new Date(ride.departureTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        const departureDate = new Date(ride.departureTime).toLocaleDateString();

        // Safely get addresses
        const fromAddress = ride.departureLocation?.address || 'Unknown departure';
        const toAddress = ride.arrivalLocation?.address || 'Unknown arrival';

        // Rating fallback
        const rating = ride.creator.rating ?? 0;

        return (
          <Link key={booking.id} href={`/rides/${ride.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Driver Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={ride.creator.avatar || undefined} />
                        <AvatarFallback>
                          {ride.creator.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{ride.creator.name || 'Unknown Driver'}</p>
                        <p className="text-sm text-muted-foreground">
                          ⭐ {rating > 0 ? rating.toFixed(1) : 'New'}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        booking.status === 'accepted'
                          ? 'default'
                          : booking.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>

                  {/* Route */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {fromAddress}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {toAddress}
                      </p>
                    </div>
                  </div>

                  {/* Time + Price */}
                  <div className="flex items-center justify-between pt-2 border-t text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {departureTime} · {departureDate}
                      </span>
                    </div>

                    <span className="font-semibold text-primary">
                      ${ride.pricePerSeat ?? 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}