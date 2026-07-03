'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import {
  connectChatSocket,
  joinChatRoom,
  joinDirectRoom,
  sendChatMessage,
  subscribeToChatMessages,
  unsubscribeFromChatMessages,
  subscribeToJoinedChat,
  unsubscribeFromJoinedChat,
  subscribeToJoinedDirect,
  unsubscribeFromJoinedDirect,
} from '@/lib/socket';
import { chatAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Image, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  senderId: number;
  content: string;
  type: 'text' | 'image';
  createdAt: string;
  sender?: { id: number; name: string; avatar?: string };
}

interface ChatWindowProps {
  otherUserId?: number;       // for direct chat
  otherUserName?: string;
  otherUserAvatar?: string;
  rideId?: string;            // for ride chat
}

export function ChatWindow({
  otherUserId,
  otherUserName,
  otherUserAvatar,
  rideId,
}: ChatWindowProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine mode
  const isRide = !!rideId;
  const isDirect = !!otherUserId && !rideId;

  if (!isRide && !isDirect) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <p>Invalid chat mode. Please provide either a rideId or otherUserId.</p>
        </CardContent>
      </Card>
    );
  }

  // ─── Socket lifecycle ───
  useEffect(() => {
    if (!user) return;

    let socket = connectChatSocket(user.id);
    if (!socket) {
      setJoinError('Missing authentication token');
      setIsConnected(false);
      setIsJoining(false);
      setLoadingHistory(false);
      return;
    }

    let isMounted = true;

    const onConnect = () => {
      console.log('🟢 Socket connected, joining...');
      setIsJoining(true);
      setJoinError(null);
      if (isRide) {
        joinChatRoom(rideId!);
      } else if (isDirect) {
        joinDirectRoom(String(otherUserId!));
      }
    };

    const onJoinedRide = (data: any) => {
      console.log('✅ Joined ride chat:', data);
      setIsConnected(true);
      setIsJoining(false);
      setJoinError(null);
      if (data.history) setMessages(data.history);
    };

    const onJoinedDirect = (data: any) => {
      console.log('✅ Joined direct chat:', data);
      setIsConnected(true);
      setIsJoining(false);
      setJoinError(null);
      if (data.history) setMessages(data.history);
    };

    const onMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // If direct message and not from me, mark as read in backend
      if (isDirect && msg.senderId !== user.id) {
        chatAPI.markAsRead(msg.id).catch(() => {});
      }
    };

    const onException = (err: any) => {
      const message = err.message || 'Failed to join chat';
      console.error('❌ Chat exception:', message);
      setJoinError(message);
      setIsConnected(false);
      setIsJoining(false);
      toast.error(message);
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onException);
    socket.on('exception', onException);

    if (isRide) {
      subscribeToJoinedChat(onJoinedRide);
    } else {
      subscribeToJoinedDirect(onJoinedDirect);
    }
    subscribeToChatMessages(onMessage);

    if (socket.connected) {
      onConnect();
    }

    // Fetch history via REST
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        let result;
        if (isRide) {
          result = await chatAPI.getRideHistory(rideId!, 1, 50);
        } else {
          result = await chatAPI.getDirectHistory(String(otherUserId!), 1, 50);
        }
        if (isMounted) setMessages(result.items || []);
      } catch (err) {
        console.warn('Failed to load history:', err);
        if (isMounted) setMessages([]);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    fetchHistory();

    return () => {
      isMounted = false;
      socket.off('connect', onConnect);
      socket.off('connect_error', onException);
      socket.off('exception', onException);
      if (isRide) {
        unsubscribeFromJoinedChat();
      } else {
        unsubscribeFromJoinedDirect();
      }
      unsubscribeFromChatMessages();
    };
  }, [user, rideId, otherUserId, isRide, isDirect]);

  // Auto‑scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ─── Send message ───
  const sendMessage = async (imageUrl?: string) => {
    if (!input.trim() && !imageUrl) return;
    const content = imageUrl || input.trim();
    const type = imageUrl ? 'image' : 'text';
    sendChatMessage({
      rideId: isRide ? rideId : undefined,
      receiverId: isDirect ? String(otherUserId) : undefined,
      content,
      type,
    });
    setInput('');
  };

  // ─── Upload image ───
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const data = await chatAPI.uploadImage(file);
      await sendMessage(data.url);
      toast.success('Image sent');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Retry ───
  const retryJoin = () => {
    setJoinError(null);
    setIsJoining(true);
    if (isRide) {
      joinChatRoom(rideId!);
    } else {
      joinDirectRoom(String(otherUserId!));
    }
  };

  // ─── UI States ───
  if (loadingHistory) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center">
        <CardContent className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading messages...
        </CardContent>
      </Card>
    );
  }

  if (joinError) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center">
        <CardContent className="text-center">
          <p className="text-destructive">{joinError}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={retryJoin}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected && isJoining) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center">
        <CardContent className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Joining chat...
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center">
        <CardContent className="text-center">
          <p className="text-muted-foreground">Not connected. <Button variant="link" onClick={retryJoin}>Retry</Button></p>
        </CardContent>
      </Card>
    );
  }

  // ─── Group messages ───
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  messages.forEach((msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString();
    if (date !== currentDate) {
      currentDate = date;
      groupedMessages.push({ date, messages: [] });
    }
    groupedMessages[groupedMessages.length - 1].messages.push(msg);
  });

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="py-3 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={otherUserAvatar} />
            <AvatarFallback>{otherUserName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          {otherUserName || 'User'}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {groupedMessages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              groupedMessages.map((group, idx) => (
                <div key={idx}>
                  <div className="text-center text-xs text-muted-foreground my-2">
                    {group.date === new Date().toLocaleDateString() ? 'Today' : group.date}
                  </div>
                  {group.messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                      >
                        <div
                          className={`max-w-[70%] flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}
                        >
                          {!isOwn && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={msg.sender?.avatar} />
                              <AvatarFallback>
                                {msg.sender?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {msg.type === 'image' && (
                                <img
                                  src={msg.content}
                                  alt="Shared image"
                                  className="max-w-[200px] rounded-md mb-1"
                                  loading="lazy"
                                />
                              )}
                              {msg.type === 'text' && (
                                <p className="text-sm break-words">{msg.content}</p>
                              )}
                            </div>
                            <div
                              className={`text-xs text-muted-foreground mt-1 ${
                                isOwn ? 'text-right' : 'text-left'
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4 items-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Image className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
            disabled={uploading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() && !uploading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}