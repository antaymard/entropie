import { useState, useCallback } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";

export function useIframeCtrlOverlay() {
  const [isHovered, setIsHovered] = useState(false);
  const [isCtrlHeld, setIsCtrlHeld] = useState(false);

  const opts = { enabled: isHovered, preventDefault: false, stopPropagation: false } as const;

  useHotkey({ key: "Control" }, () => setIsCtrlHeld(true),  { ...opts, eventType: "keydown" });
  useHotkey({ key: "Control" }, () => setIsCtrlHeld(false), { ...opts, eventType: "keyup" });
  useHotkey({ key: "Meta" },    () => setIsCtrlHeld(true),  { ...opts, eventType: "keydown" });
  useHotkey({ key: "Meta" },    () => setIsCtrlHeld(false), { ...opts, eventType: "keyup" });

  const onMouseEnter = useCallback((e: React.MouseEvent) => {
    setIsHovered(true);
    if (e.ctrlKey || e.metaKey) setIsCtrlHeld(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsCtrlHeld(false);
  }, []);

  return {
    showOverlay: isHovered && isCtrlHeld,
    onMouseEnter,
    onMouseLeave,
  };
}
