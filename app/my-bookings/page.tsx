import MyBookings from '@/components/bookings/MyBookings';

export default function MyBookingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground mt-1">Your upcoming rides and bookings</p>
      </div>
      <MyBookings />
    </div>
  );
}
