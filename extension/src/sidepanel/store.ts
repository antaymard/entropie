import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PageContext } from "../shared/types";

interface ExtensionStore {
  selectedCanvasId: string | null;
  canvasName: string;
  attachedPage: PageContext | null;

  setSelectedCanvas: (canvasId: string, name: string) => void;
  attachPage: (page: PageContext) => void;
  removeAttachedPage: () => void;
  resetAttachments: () => void;
}

export const useExtensionStore = create<ExtensionStore>()(
  devtools(
    (set) => ({
      selectedCanvasId: null,
      canvasName: "",
      attachedPage: null,

      setSelectedCanvas: (canvasId, name) =>
        set({ selectedCanvasId: canvasId, canvasName: name }),

      attachPage: (page) => set({ attachedPage: page }),

      removeAttachedPage: () => set({ attachedPage: null }),

      resetAttachments: () => set({ attachedPage: null }),
    }),
    { name: "extension-store" },
  ),
);