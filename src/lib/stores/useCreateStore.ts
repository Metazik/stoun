import { create } from "zustand";
import type { ProjectSource } from "@/types";

type CreateState = {
  step: 1 | 2 | 3;
  sourceType: ProjectSource | null;
  blob: Blob | null;
  previewUrl: string | null;
  sourceLabel: string | null;
  tags: string[];
  instruction: string;
  setSource: (sourceType: ProjectSource, blob: Blob, previewUrl: string, label: string) => void;
  toggleTag: (tag: string) => void;
  setInstruction: (v: string) => void;
  goTo: (step: 1 | 2 | 3) => void;
  reset: () => void;
};

export const useCreateStore = create<CreateState>((set) => ({
  step: 1,
  sourceType: null,
  blob: null,
  previewUrl: null,
  sourceLabel: null,
  tags: [],
  instruction: "",
  setSource: (sourceType, blob, previewUrl, sourceLabel) =>
    set({ sourceType, blob, previewUrl, sourceLabel, step: 3 }),
  toggleTag: (tag) =>
    set((s) => ({
      tags: s.tags.includes(tag) ? s.tags.filter((t) => t !== tag) : [...s.tags, tag],
    })),
  setInstruction: (instruction) => set({ instruction }),
  goTo: (step) => set({ step }),
  reset: () =>
    set({ step: 1, sourceType: null, blob: null, previewUrl: null, sourceLabel: null, tags: [], instruction: "" }),
}));
