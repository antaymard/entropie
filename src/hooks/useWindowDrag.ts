import { useRef, useCallback } from "react";
import { useWindowsStore } from "@/stores/windowsStore";
import type { ResizeDirection } from "@/types/ui";

interface DragAction {
  type: "move" | "resize";
  from?: ResizeDirection;
}

export function useWindowDrag(windowId: string) {
  const initialMousePosition = useRef<{ x: number; y: number } | null>(null);
  const dragAction = useRef<DragAction | null>(null);

  const moveWindow = useWindowsStore((state) => state.moveWindow);
  const resizeWindow = useWindowsStore((state) => state.resizeWindow);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!initialMousePosition.current || !dragAction.current) return;

      const deltaX = e.clientX - initialMousePosition.current.x;
      const deltaY = e.clientY - initialMousePosition.current.y;

      if (dragAction.current.type === "move") {
        moveWindow(windowId, { x: deltaX, y: deltaY });
      }

      if (dragAction.current.type === "resize" && dragAction.current.from) {
        const from = dragAction.current.from;

        switch (from) {
          case "tl":
            moveWindow(windowId, { x: deltaX, y: deltaY });
            resizeWindow(windowId, { x: -deltaX, y: -deltaY });
            break;
          case "tc":
            moveWindow(windowId, { x: 0, y: deltaY });
            resizeWindow(windowId, { x: 0, y: -deltaY });
            break;
          case "tr":
            moveWindow(windowId, { x: 0, y: deltaY });
            resizeWindow(windowId, { x: deltaX, y: -deltaY });
            break;
          case "ml":
            moveWindow(windowId, { x: deltaX, y: 0 });
            resizeWindow(windowId, { x: -deltaX, y: 0 });
            break;
          case "mr":
            resizeWindow(windowId, { x: deltaX, y: 0 });
            break;
          case "bl":
            moveWindow(windowId, { x: deltaX, y: 0 });
            resizeWindow(windowId, { x: -deltaX, y: deltaY });
            break;
          case "bc":
            resizeWindow(windowId, { x: 0, y: deltaY });
            break;
          case "br":
            resizeWindow(windowId, { x: deltaX, y: deltaY });
            break;
        }
      }

      initialMousePosition.current = { x: e.clientX, y: e.clientY };
    },
    [windowId, moveWindow, resizeWindow]
  );

  const handleMouseUp = useCallback(() => {
    initialMousePosition.current = null;
    dragAction.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.removeProperty("user-select");
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "move" | "resize", from?: ResizeDirection) => {
      dragAction.current = { type, from };
      initialMousePosition.current = { x: e.clientX, y: e.clientY };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    },
    [handleMouseMove, handleMouseUp]
  );

  return { handleMouseDown };
}
