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
          const existingWindow = state.openWindows.find(
            (w) => w === xyNodeId
          );
          if (existingWindow) {
            // Si la fenêtre existe et est minimisée, on la déminimise
            return state;
          }
          return {
            openWindows: [...state.openWindows, xyNodeId],
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
