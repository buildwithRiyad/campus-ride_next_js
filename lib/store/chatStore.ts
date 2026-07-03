import { create } from 'zustand';

interface ChatStore {
  // ─── Unread count ───
  unreadCount: number;
  setUnread: (count: number) => void;
  incrementUnread: () => void;
  resetUnread: () => void;

  // ─── Dialog state ───
  isOpen: boolean;
  rideId?: string;
  otherUserId?: number;
  otherUserName?: string;
  otherUserAvatar?: string;
  lastChatTarget?: {
    rideId?: string;
    otherUserId?: number;
    otherUserName?: string;
    otherUserAvatar?: string;
  };
  openChat: (params: {
    rideId?: string;
    otherUserId?: number;
    otherUserName?: string;
    otherUserAvatar?: string;
  }) => void;
  closeChat: () => void;
  setLastChatTarget: (params: {
    rideId?: string;
    otherUserId?: number;
    otherUserName?: string;
    otherUserAvatar?: string;
  } | undefined) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  // Unread
  unreadCount: 0,
  setUnread: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),

  // Dialog
  isOpen: false,
  rideId: undefined,
  otherUserId: undefined,
  otherUserName: undefined,
  otherUserAvatar: undefined,
  lastChatTarget: undefined,
  openChat: (params) => set({ isOpen: true, ...params }),
  closeChat: () =>
    set({
      isOpen: false,
      rideId: undefined,
      otherUserId: undefined,
      otherUserName: undefined,
      otherUserAvatar: undefined,
      lastChatTarget: undefined,
    }),
  setLastChatTarget: (params) => set({ lastChatTarget: params }),
}));