'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChatWindow } from './ChatWindow';
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
  const [open, setOpen] = useState(false);
  const { unreadCount, resetUnread } = useChatStore();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) resetUnread();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 relative"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="h-4 w-4" />
        Chat
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-red-500 text-white border-2 border-background text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat</DialogTitle>
          </DialogHeader>
          <ChatWindow
            otherUserId={rideId ? undefined : otherUserId}
            otherUserName={otherUserName}
            otherUserAvatar={otherUserAvatar}
            rideId={rideId}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}