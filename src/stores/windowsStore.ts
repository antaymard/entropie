import type { Node } from "@xyflow/react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface WindowsStore {
  openWindows: string[];
  openWindow: (xyNodeId: string) => void;
  closeWindow: (xyNodeId: string) => void;
  closeAllWindows: () => void;
}

export const useWindowsStore = create<WindowsStore>()(
  devtools(
    (set) => ({
      openWindows: [],
      openWindow: (xyNodeId: string) => {
        set((state) => {
          if (state.openWindows[0] === xyNodeId) {
            return state;
          }
          return {
            openWindows: [xyNodeId],
          };
        });
      },
      closeWindow: (xyNodeId: string) => {
        set((state) => ({
          openWindows: state.openWindows.filter(
            (window) => window !== xyNodeId
          ),
        }));
      },
      closeAllWindows: () => {
        set(() => ({
          openWindows: [],
        }));
      },
    }),
    { name: "windows-store" }
  )
);
