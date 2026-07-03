'use client';

import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { usersAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatButton } from '@/components/Chat/ChatButton';

interface UserProfileProps {
  userId: string;
}

export default function UserProfile({ userId }: UserProfileProps) {
  const { user: currentUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await usersAPI.getById(userId);
        setProfileUser(data);
      } catch (error) {
        toast.error('Failed to fetch user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  // 🔍 Debug logs (remove in production)
  console.log('👤 Current user:', currentUser);
  console.log('👤 Profile user ID:', userId, 'type:', typeof userId);
  console.log('👤 Profile user:', profileUser);

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!profileUser) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          User not found
        </CardContent>
      </Card>
    );
  }

  // Safely compare IDs (both as numbers)
  const currentUserId = currentUser?.id ? Number(currentUser.id) : null;
  const profileUserId = Number(userId);
  const isOwnProfile = currentUserId === profileUserId;

  console.log('🔍 isOwnProfile:', isOwnProfile);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar className="size-24">
                <AvatarImage
                  src={profileUser.profileImage}
                  alt={profileUser.name}
                />
                <AvatarFallback className="text-2xl">
                  {profileUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-3xl font-bold">
                  {profileUser.name}
                </h1>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className="text-lg">
                    ⭐ {(profileUser.rating ?? 0).toFixed(1)}
                  </Badge>

                  <Badge variant="outline">
                    {profileUser.university}
                  </Badge>

                  {profileUser.isVerified && (
                    <Badge>Verified</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span>{profileUser.email}</span>
                </div>

                {profileUser.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span>{profileUser.phone}</span>
                  </div>
                )}

                {profileUser.department && (
                  <div>
                    <span className="font-medium">Department:</span>{' '}
                    {profileUser.department}
                  </div>
                )}

                <div>
                  <span className="font-medium">Student ID:</span>{' '}
                  {profileUser.studentId}
                </div>
              </div>

              {/* Show ChatButton only for other users and when current user exists */}
              {!isOwnProfile && currentUser && (
                <div className="mt-4">
                  <ChatButton
                    otherUserId={profileUser.id}
                    otherUserName={profileUser.name}
                    otherUserAvatar={profileUser.profileImage}
                    // rideId is optional – creates a direct chat (fallback UI)
                  />
                </div>
              )}

              {/* Debug info – remove in production */}
              <div className="mt-2 text-xs text-muted-foreground">
                Debug: isOwnProfile = {String(isOwnProfile)}, currentUser exists ={' '}
                {String(!!currentUser)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {(profileUser.rating ?? 0).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {profileUser.isVerified ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {profileUser.university}
              </div>
              <div className="text-sm text-muted-foreground">University</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {new Date(profileUser.createdAt).getFullYear()}
              </div>
              <div className="text-sm text-muted-foreground">Member Since</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About Card */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Member Since</p>
              <p className="font-semibold">
                {new Date(profileUser.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Account Status</p>
              <Badge variant="secondary">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}