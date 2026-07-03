'use client';

import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useChatStore } from '@/lib/store/chatStore';
import { Badge } from '@/components/ui/badge';

interface ChatButtonProps {
  otherUserId: number;
  otherUserName?: string;
  otherUserAvatar?: string;
  rideId?: string; // optional: if provided, opens ride chat; else direct chat
}

export function ChatButton({
  otherUserId,
  otherUserName,
  otherUserAvatar,
  rideId,
}: ChatButtonProps) {
  const { unreadCount, resetUnread, openChat } = useChatStore();

  const handleOpen = () => {
    resetUnread(); // clear badge when chat opens
    openChat({
      rideId,
      otherUserId,
      otherUserName,
      otherUserAvatar,
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 relative"
      onClick={handleOpen}
    >
      <MessageSquare className="h-4 w-4" />
      Chat
      {unreadCount > 0 && (
        <Badge
          className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-red-500 text-white border-2 border-background text-xs font-medium"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}