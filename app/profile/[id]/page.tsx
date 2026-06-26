'use client';

import { useParams } from 'next/navigation';
import UserProfile from '@/components/profile/UserProfile';

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  return (
    <div className="max-w-4xl mx-auto">
      <UserProfile userId={userId} />
    </div>
  );
}
