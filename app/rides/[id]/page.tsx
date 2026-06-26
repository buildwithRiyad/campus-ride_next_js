'use client';

import { useParams } from 'next/navigation';
import { useRide } from '@/hooks/useRides';
import RideDetail from '@/components/rides/RideDetail';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function RideDetailPage() {
  const params = useParams();
  const rideId = params.id as string;
  const { ride, isLoading, error } = useRide(rideId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (error || !ride) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Ride not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <RideDetail ride={ride} />
    </div>
  );
}
