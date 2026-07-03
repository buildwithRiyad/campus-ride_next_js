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
import { Image, Send, Loader2, MessageSquare, ChevronDown } from 'lucide-react';
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
  otherUserId?: number;
  otherUserName?: string;
  otherUserAvatar?: string;
  rideId?: string;
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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const isRide = !!rideId;
  const isDirect = !!otherUserId && !rideId;

  // ─── Friendly fallback ───
  if (!isRide && !isDirect) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center">
        <CardContent className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">No conversation selected</p>
          <p className="text-sm">Open a chat from a ride or user profile</p>
        </CardContent>
      </Card>
    );
  }

  const isComposerDisabled = uploading || loadingHistory || isJoining || !isConnected || !!joinError;
  const statusText = loadingHistory
    ? 'Loading messages...'
    : joinError
      ? joinError
      : isJoining
        ? 'Joining chat...'
        : !isConnected
          ? 'Not connected'
          : '';

  // ─── Scroll helpers ───
  const checkIfAtBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    isAtBottomRef.current = atBottom;
    setShowScrollButton(!atBottom);
    return atBottom;
  };

  const scrollToBottom = (smooth = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    isAtBottomRef.current = true;
    setShowScrollButton(false);
  };

  // ─── Listen to scroll events ───
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const onScroll = () => checkIfAtBottom();
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // ─── Auto‑scroll on new messages ───
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(false);
    }
  }, [messages]);

  // ─── Socket lifecycle ───
  useEffect(() => {
    if (!user) {
      setLoadingHistory(false);
      setIsConnected(false);
      setIsJoining(false);
      setJoinError('Please log in to use chat');
      return;
    }

    const socket = connectChatSocket(user.id);
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
    <Card className="h-[600px] flex flex-col overflow-hidden bg-white">
      <CardHeader className="flex-shrink-0 border-b bg-blue-50/80 py-3 backdrop-blur">
        <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
          <Avatar className="h-8 w-8">
            <AvatarImage src={otherUserAvatar} />
            <AvatarFallback className="bg-blue-200 text-blue-800">{otherUserName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          {otherUserName || 'User'}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-slate-50 to-blue-50/30 p-4 pt-4">
        {statusText && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
            {(loadingHistory || isJoining) && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
            <span className={joinError ? 'text-destructive' : ''}>{statusText}</span>
            {joinError && (
              <Button variant="link" size="sm" className="ml-auto h-auto p-0 text-blue-600" onClick={retryJoin}>
                Retry
              </Button>
            )}
          </div>
        )}

        {/* ─── Scrollable container ─── */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pr-4 space-y-4"
        >
          {groupedMessages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No messages yet. Start the conversation!
            </p>
          ) : (
            groupedMessages.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <div className="text-center text-xs text-muted-foreground my-2">
                  {group.date === new Date().toLocaleDateString() ? 'Today' : group.date}
                </div>
                {group.messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  const senderName = msg.sender?.name || 'Unknown';
                  const senderAvatar = msg.sender?.avatar;

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
                            <AvatarImage src={senderAvatar} />
                            <AvatarFallback>
                              {senderName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          {!isOwn && (
                            <p className="text-xs text-muted-foreground mb-1 font-medium">
                              {senderName}
                            </p>
                          )}
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

        {/* ─── Floating scroll‑to‑bottom button ─── */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-20 right-6 z-10 rounded-full bg-primary p-2 text-primary-foreground shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}

        {/* ─── Input bar ─── */}
        <div className="flex gap-2 mt-4 items-center flex-shrink-0">
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
            className="flex-1 border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500"
            disabled={isComposerDisabled}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isComposerDisabled}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}