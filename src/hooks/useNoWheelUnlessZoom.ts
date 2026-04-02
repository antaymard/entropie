import { useEffect, type RefObject } from "react";

/**
 * Blocks wheel events from bubbling to React Flow (preventing canvas pan)
 * unless Ctrl/Meta is held (allowing zoom).
 *
 * Replaces the `nowheel` CSS class with selective behavior:
 * - Normal wheel → stopPropagation → text scrolls, canvas doesn't pan
 * - Ctrl/Meta + wheel → event bubbles → React Flow zooms
 */
export function useNoWheelUnlessZoom(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        e.stopPropagation();
      }
    };

    el.addEventListener("wheel", handler, { passive: true });
    return () => el.removeEventListener("wheel", handler);
  }, [ref]);
}
