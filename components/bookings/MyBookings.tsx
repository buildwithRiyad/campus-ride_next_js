'use client';

import { useEffect, useState } from 'react';
import { Ride } from '@/lib/types';
import { bookingsAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyBookings() {
  const [bookings, setBookings] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await bookingsAPI.getMyBookings();
        setBookings(data);
      } catch (error) {
        toast.error('Failed to fetch bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">No bookings yet</p>
          <Link href="/" className="text-primary hover:underline">
            Explore rides
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((ride) => {
        const departureTime = new Date(ride.departureTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        const departureDate = new Date(ride.departureTime).toLocaleDateString();

        return (
          <Link key={ride.id} href={`/rides/${ride.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Driver Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={ride.driver.avatar} alt={ride.driver.name} />
                        <AvatarFallback>{ride.driver.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{ride.driver.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ⭐ {ride.driver.rating.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={ride.status === 'completed' ? 'secondary' : 'default'}>
                      {ride.status}
                    </Badge>
                  </div>

                  {/* Route */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{ride.departureLocation.address}</p>
                    </div>
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{ride.arrivalLocation.address}</p>
                    </div>
                  </div>

                  {/* Time and Price */}
                  <div className="flex items-center justify-between pt-2 border-t text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {departureTime} - {departureDate}
                      </span>
                    </div>
                    <span className="font-semibold text-primary">${ride.pricePerSeat}</span>
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
