'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          CampusRide
        </Link>

        <div className="flex items-center gap-6">
          {isAuthenticated && user ? (
            <>
              <Link href="/" className="hover:text-primary transition-colors">
                Rides
              </Link>
              <Link href="/create-ride" className="hover:text-primary transition-colors">
                Create Ride
              </Link>
              <Link href="/my-bookings" className="hover:text-primary transition-colors">
                My Bookings
              </Link>
              <div className="flex items-center gap-4">
                <Link href={`/profile/${user.id}`} className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm">{user.name}</span>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
