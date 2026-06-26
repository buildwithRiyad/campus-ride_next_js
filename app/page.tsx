'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useRides } from '@/hooks/useRides';
import RideCard from '@/components/rides/RideCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function Page() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore();
  const { rides, isLoading: ridesLoading } = useRides();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  if (!mounted || authLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">RideShare</h1>
              <p className="text-muted-foreground">
                Easy and affordable carpooling for your campus
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/login" className="block">
                <Button className="w-full">Login</Button>
              </Link>
              <Link href="/register" className="block">
                <Button variant="outline" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              Join thousands of students sharing rides on campus
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Available Rides</h1>
          <p className="text-muted-foreground mt-1">Find your next ride</p>
        </div>
        <Link href="/create-ride">
          <Button size="lg">Create Ride</Button>
        </Link>
      </div>

      {ridesLoading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : rides.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No rides available at the moment</p>
            <Link href="/create-ride">
              <Button>Create the first ride</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </div>
  );
}
