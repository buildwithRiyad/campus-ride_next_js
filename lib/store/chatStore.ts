import { create } from 'zustand';

interface ChatStore {
  unreadCount: number;
  setUnread: (count: number) => void;
  incrementUnread: () => void;
  resetUnread: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  unreadCount: 0,
  setUnread: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
}));