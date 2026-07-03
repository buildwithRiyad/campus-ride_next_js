'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChatWindow } from './ChatWindow';
import { MessageSquare, X } from 'lucide-react';

interface ChatButtonProps {
  otherUserId: number;
  otherUserName?: string;
  rideId?: string;
}

export function ChatButton({ otherUserId, otherUserName, rideId }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageSquare className="h-4 w-4" />
        {isOpen ? 'Close Chat' : 'Chat'}
      </Button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-[400px] max-w-[90vw] z-50 shadow-2xl rounded-lg border bg-background">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-semibold">
              Chat with {otherUserName || 'User'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ChatWindow
            otherUserId={otherUserId}
            otherUserName={otherUserName}
            rideId={rideId}
          />
        </div>
      )}
    </>
  );
}