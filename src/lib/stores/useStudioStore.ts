import { create } from "zustand";
import type { MusicSettings, Project, VocalSettings } from "@/types";

type StudioState = {
  project: Project | null;
  originalUrl: string;
  currentUrl: string;
  vocalSettings: VocalSettings;
  musicSettings: MusicSettings;
  pendingAction: string | null;
  init: (project: Project, originalUrl: string, currentUrl: string) => void;
  setPending: (action: string | null) => void;
  applyResult: (audioUrl: string, vocal: VocalSettings, music: MusicSettings) => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  project: null,
  originalUrl: "",
  currentUrl: "",
  vocalSettings: {
    improved: false,
    pitchCorrected: false,
    timingCorrected: false,
    harmonyAdded: false,
    warmth: 0,
    emotion: 0,
  },
  musicSettings: { activeLayers: [], arrangementGenerated: false, mastered: false },
  pendingAction: null,
  init: (project, originalUrl, currentUrl) =>
    set({
      project,
      originalUrl,
      currentUrl,
      vocalSettings: project.vocalSettings,
      musicSettings: project.musicSettings,
    }),
  setPending: (pendingAction) => set({ pendingAction }),
  applyResult: (audioUrl, vocal, music) =>
    set({ currentUrl: audioUrl, vocalSettings: vocal, musicSettings: music, pendingAction: null }),
}));
