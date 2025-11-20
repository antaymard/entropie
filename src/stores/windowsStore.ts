import type { Window } from "@/types/windows.types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface WindowsStore {
  openWindows: Window[];
  openWindow: (window: Window) => void;
  closeWindow: (windowId: string) => void;
  closeAllWindows: () => void;
  updateWindowPosition: (
    windowId: string,
    position: { x: number; y: number }
  ) => void;
  updateWindowSize: (windowId: string, width: number, height: number) => void;
  moveWindow: (windowId: string, delta: { x: number; y: number }) => void;
  resizeWindow: (windowId: string, delta: { x: number; y: number }) => void;
  expandWindow: (windowId: string, isExpanded?: boolean) => void;
  toggleMinimizeWindow: (windowId: string, isMinimized?: boolean) => void;
}

export const useWindowsStore = create<WindowsStore>()(
  devtools(
    (set) => ({
      openWindows: [],
      openWindow: (window: Window) => {
        set((state) => {
          const existingWindow = state.openWindows.find(
            (w) => w.id === window.id
          );
          if (existingWindow) {
            return state;
          }
          return {
            openWindows: [...state.openWindows, window],
          };
        });
      },
      toggleMinimizeWindow: (windowId: string, isMinimized?: boolean) => {
        set((state) => ({
          openWindows: state.openWindows.map((window) =>
            window.id === windowId
              ? { ...window, isMinimized: isMinimized ?? !window.isMinimized }
              : window
          ),
        }));
      },
      closeWindow: (windowId: string) => {
        set((state) => ({
          openWindows: state.openWindows.filter(
            (window) => window.id !== windowId
          ),
        }));
      },
      closeAllWindows: () => {
        set(() => ({
          openWindows: [],
        }));
      },
      updateWindowPosition: (
        windowId: string,
        position: { x: number; y: number }
      ) => {
        set((state) => ({
          openWindows: state.openWindows.map((window) =>
            window.id === windowId ? { ...window, position } : window
          ),
        }));
      },
      updateWindowSize: (windowId: string, width: number, height: number) => {
        set((state) => ({
          openWindows: state.openWindows.map((window) =>
            window.id === windowId ? { ...window, width, height } : window
          ),
        }));
      },
      moveWindow: (windowId: string, delta: { x: number; y: number }) => {
        set((state) => ({
          openWindows: state.openWindows.map((window) =>
            window.id === windowId
              ? {
                  ...window,
                  position: {
                    x: window.position.x + delta.x,
                    y: window.position.y + delta.y,
                  },
                }
              : window
          ),
        }));
      },
      resizeWindow: (windowId: string, delta: { x: number; y: number }) => {
        set((state) => ({
          openWindows: state.openWindows.map((window) =>
            window.id === windowId
              ? {
                  ...window,
                  width: Math.max(200, window.width + delta.x),
                  height: Math.max(150, window.height + delta.y),
                }
              : window
          ),
        }));
      },
      expandWindow: (windowId: string, isExpanded?: boolean) => {
        set((state) => ({
          openWindows: state.openWindows.map((window) =>
            window.id === windowId
              ? { ...window, isExpanded: !isExpanded }
              : window
          ),
        }));
      },
    }),
    { name: "windows-store" }
  )
);
