'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRideSchema, type CreateRideInput } from '@/lib/schemas';
import { ridesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CreateRideForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateRideInput>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      fromLocation: '',
      toLocation: '',
      departureTime: '',
      vehicleType: 'CAR',
      availableSeats: 1,
      pricePerSeat: 0,
      note: '',
    },
  });

  const onSubmit = async (data: CreateRideInput) => {
    try {
      setIsLoading(true);

      const ride = await ridesAPI.create(data);

      toast.success('Ride created successfully!');
      router.push(`/rides/${ride.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create ride');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create a New Ride</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Route Section */}
              <div className="space-y-4 border-b pb-6">
                <h3 className="font-semibold text-lg">Route</h3>

                {/* Departure */}
                <div>
                  <label className="text-sm font-medium">Departure Address</label>
                  <Input
                    {...form.register('fromLocation')}
                    placeholder="e.g., Dhaka University"
                    className="mt-1"
                  />
                  {form.formState.errors.fromLocation && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.fromLocation.message}
                    </p>
                  )}
                </div>

                {/* Arrival */}
                <div>
                  <label className="text-sm font-medium">Arrival Address</label>
                  <Input
                    {...form.register('toLocation')}
                    placeholder="e.g., Uttara"
                    className="mt-1"
                  />
                  {form.formState.errors.toLocation && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.toLocation.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4 border-b pb-6">
                <h3 className="font-semibold text-lg">Schedule</h3>

                <div>
                  <label className="text-sm font-medium">Departure Time</label>
                  <Input
                    {...form.register('departureTime')}
                    type="datetime-local"
                    className="mt-1"
                  />
                  {form.formState.errors.departureTime && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.departureTime.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4 border-b pb-6">
                <h3 className="font-semibold text-lg">Trip Details</h3>

                {/* Vehicle Type */}
                <div>
                  <label className="text-sm font-medium">Vehicle Type</label>

                  <select
                    {...form.register('vehicleType')}
                    className="w-full border rounded-md p-2 mt-1"
                  >
                    <option value="CAR">Car</option>
                    <option value="BIKE">Bike</option>
                    <option value="RICKSHAW">Rickshaw</option>
                    <option value="CNG">CNG</option>
                  </select>

                  {form.formState.errors.vehicleType && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.vehicleType.message}
                    </p>
                  )}
                </div>

                {/* Seats + Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className="text-sm font-medium">Available Seats</label>
                    <Input
                      {...form.register('availableSeats', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="8"
                      className="mt-1"
                    />
                    {form.formState.errors.availableSeats && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.availableSeats.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Price Per Seat</label>
                    <Input
                      {...form.register('pricePerSeat', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      className="mt-1"
                    />
                    {form.formState.errors.pricePerSeat && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.pricePerSeat.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Input
                    {...form.register('note')}
                    placeholder="Any extra info about the ride"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Ride'}
                </Button>

                <Link href="/" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}