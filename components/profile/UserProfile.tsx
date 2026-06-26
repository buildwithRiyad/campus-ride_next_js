'use client';

import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { usersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfileProps {
  userId: string;
}

export default function UserProfile({
  userId,
}: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await usersAPI.getById(userId);
        setUser(data);
      } catch (error) {
        toast.error('Failed to fetch user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          User not found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar className="size-24">
                <AvatarImage
                  src={user.profileImage}
                  alt={user.name}
                />
                <AvatarFallback className="text-2xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-3xl font-bold">
                  {user.name}
                </h1>

                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className="text-lg"
                  >
                    ⭐ {(user.rating ?? 0).toFixed(1)}
                  </Badge>

                  <Badge variant="outline">
                    {user.university}
                  </Badge>

                  {user.isVerified && (
                    <Badge>Verified</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}

                {user.department && (
                  <div>
                    <span className="font-medium">
                      Department:
                    </span>{' '}
                    {user.department}
                  </div>
                )}

                <div>
                  <span className="font-medium">
                    Student ID:
                  </span>{' '}
                  {user.studentId}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {(user.rating ?? 0).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                Rating
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {user.isVerified ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-muted-foreground">
                Verified
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {user.university}
              </div>
              <div className="text-sm text-muted-foreground">
                University
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {new Date(
                  user.createdAt
                ).getFullYear()}
              </div>
              <div className="text-sm text-muted-foreground">
                Member Since
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Member Since
              </p>

              <p className="font-semibold">
                {new Date(
                  user.createdAt
                ).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Account Status
              </p>

              <Badge variant="secondary">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}