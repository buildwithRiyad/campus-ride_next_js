'use client';

import Link from 'next/link';
import { Ride } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  MapPin,
  Clock,
  Users,
} from 'lucide-react';

interface RideCardProps {
  ride: Ride;
}

export default function RideCard({
  ride,
}: RideCardProps) {
  const departureDate = new Date(
    ride.departureTime
  ).toLocaleDateString();

  const departureTime = new Date(
    ride.departureTime
  ).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link href={`/rides/${ride.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="space-y-4">

            {/* Creator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={ride.creator?.profileImage || ''}
                  />

                  <AvatarFallback>
                    {ride.creator?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-semibold">
                    {ride.creator?.name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    ⭐ {ride.creator?.rating ?? 0}
                  </p>
                </div>
              </div>

              <Badge>
                {ride.status}
              </Badge>
            </div>

            {/* Route */}
            <div className="space-y-2">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />

                <div>
                  <p className="text-sm font-semibold">
                    From
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {ride.fromLocation}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />

                <div>
                  <p className="text-sm font-semibold">
                    To
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {ride.toLocation}
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t">
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />

                  <div>
                    <p className="font-semibold">
                      {departureTime}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {departureDate}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />

                  <div>
                    <p className="font-semibold">
                      {ride.availableSeats}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      seats
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-lg text-primary">
                  ৳{ride.pricePerSeat}
                </p>

                <p className="text-xs text-muted-foreground">
                  per seat
                </p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </Link>
  );
}