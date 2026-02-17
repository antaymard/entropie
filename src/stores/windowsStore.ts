import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useCanvasStore } from "./canvasStore";

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
        useCanvasStore.getState().setFocus("canvas");
        set((state) => ({
          openWindows: state.openWindows.filter(
            (window) => window !== xyNodeId,
          ),
        }));
      },
      closeAllWindows: () => {
        useCanvasStore.getState().setFocus("canvas");
        set(() => ({
          openWindows: [],
        }));
      },
    }),
    { name: "windows-store" },
  ),
);
