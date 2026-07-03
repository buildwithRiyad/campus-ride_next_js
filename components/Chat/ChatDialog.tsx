'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChatWindow } from './ChatWindow';
import { useChatStore } from '@/lib/store/chatStore';

export function ChatDialog() {
  const { isOpen, rideId, otherUserId, otherUserName, otherUserAvatar, closeChat } = useChatStore();

  // If no chat is open, don't render anything
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeChat()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[80vh] z-[9999]">
        <ChatWindow
          rideId={rideId}
          otherUserId={otherUserId}
          otherUserName={otherUserName}
          otherUserAvatar={otherUserAvatar}
        />
      </DialogContent>
    </Dialog>
  );
}