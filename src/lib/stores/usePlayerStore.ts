import { create } from "zustand";

type PlayerState = {
  activePostId: string | null;
  muted: boolean;
  setActivePost: (postId: string | null) => void;
  toggleMuted: () => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  activePostId: null,
  muted: false,
  setActivePost: (postId) => set({ activePostId: postId }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}));
