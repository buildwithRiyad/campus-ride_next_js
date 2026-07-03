'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import {
  connectChatSocket,
  sendChatMessage,
  getChatHistory,
  subscribeToChatMessages,
  unsubscribeFromChatMessages,
  subscribeToChatHistory,
  unsubscribeFromChatHistory,
} from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  senderId: number;
  receiverId: number;
  content: string;
  rideId?: string;
  createdAt: string;
  sender?: { name: string };
}

interface ChatWindowProps {
  otherUserId: number;
  otherUserName?: string;
  rideId?: string;
}

export function ChatWindow({ otherUserId, otherUserName, rideId }: ChatWindowProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const socket = connectChatSocket(user.id);
    setIsConnected(true);

    const onMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onHistory = (history: Message[]) => {
      setMessages(history);
    };

    subscribeToChatMessages(onMessage);
    subscribeToChatHistory(onHistory);

    // Load chat history
    getChatHistory(otherUserId, rideId);

    return () => {
      unsubscribeFromChatMessages();
      unsubscribeFromChatHistory();
    };
  }, [user, otherUserId, rideId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    sendChatMessage(otherUserId, input, rideId);
    setInput('');
  };

  if (!isConnected) {
    return <div className="p-4 text-center text-muted-foreground">Connecting...</div>;
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="py-3 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{otherUserName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          {otherUserName || 'User'}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderId === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.senderId === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}