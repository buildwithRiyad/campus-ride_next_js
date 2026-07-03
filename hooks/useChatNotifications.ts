'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useChatStore } from '@/lib/store/chatStore';
import { subscribeToChatMessages, unsubscribeFromChatMessages } from '@/lib/socket';
import { chatAPI } from '@/lib/api';

export function useChatNotifications() {
  const { user } = useAuthStore();
  const { incrementUnread, setUnread, setLastChatTarget } = useChatStore();

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread count
    chatAPI.getUnreadCount().then((count) => {
      setUnread(count);
    }).catch(() => {});

    const onMessage = (msg: any) => {
      // Only increment if message is not from me
      if (msg.senderId !== user.id) {
        incrementUnread();
        setLastChatTarget({
          otherUserId: msg.sender?.id ?? msg.senderId,
          otherUserName: msg.sender?.name,
          otherUserAvatar: msg.sender?.avatar,
        });
      }
    };

    subscribeToChatMessages(onMessage);

    return () => {
      unsubscribeFromChatMessages();
    };
  }, [user, incrementUnread, setUnread, setLastChatTarget]);
}