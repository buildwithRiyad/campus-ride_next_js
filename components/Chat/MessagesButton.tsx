'use client';

import { useChatStore } from '@/lib/store/chatStore';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function MessagesButton() {
  const { unreadCount, resetUnread, openChat, lastChatTarget } = useChatStore();

  const handleClick = () => {
    resetUnread(); // clear badge when opened
    openChat(lastChatTarget ?? {}); // open the latest direct chat from the notification
  };

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={handleClick}>
      <MessageSquare className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-red-500 text-white border-2 border-background"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}