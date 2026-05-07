import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useReactFlow } from "@xyflow/react";
import { useMutation } from "convex/react";
import { useParams } from "@tanstack/react-router";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

const MIN_DELTA = 0.5;
const PERSIST_DEBOUNCE_MS = 120;

function logTitleSizing(nodeId: string, event: string, payload?: unknown) {
  if (payload !== undefined) {
    console.log(`[TitleNodeSizing][${nodeId}] ${event}`, payload);
    return;
  }
  console.log(`[TitleNodeSizing][${nodeId}] ${event}`);
}

// Tracks nodes with an in-flight auto-size debounce so useCanvasNodes can
// skip the redundant dimension mutation that would otherwise fire via the
// ResizeObserver path for the same change.
export const pendingAutoSizeIds = new Set<string>();

interface UseTitleNodeSizingArgs {
  nodeId: string;
  ghostRef: RefObject<HTMLElement | null>;
  /** False while node data values are still loading; skips sizing side effects. */
  isHydrated?: boolean;
  /** False until the user interacts with the node (edit/resize/toolbar). */
  isInteractionEnabled?: boolean;
  /** "auto": width follows text on a single line; "manual": width fixed, height adapts to wrapped text */
  sizingMode: "auto" | "manual";
  /** Current node width (px) coming from React Flow / Convex */
  currentWidth: number;
  /** Current node height (px) coming from React Flow / Convex */
  currentHeight: number;
  /** Current text — used to retrigger measurement */
  text: string;
  /** Current heading level — used to retrigger measurement */
  level: string;
  /** Live text being typed (uncontrolled). When set, measure from this instead of `text`. */
  liveText?: string;
  /** Padding (px) inside the NodeFrame around the editable element (left + right) */
  paddingX?: number;
  /** Padding (px) inside the NodeFrame around the editable element (top + bottom) */
  paddingY?: number;
  /** Border (px) of the NodeFrame, both horizontal and vertical sides combined. */
  borderTotal?: number;
}

/**
 * Drives the auto/manual sizing of a TitleNode by measuring a hidden ghost
 * element and persisting dimensions through the canvasNodes mutation
 * (which already does an optimistic update so React Flow reflects the change
 * within a frame).
 */
export function useTitleNodeSizing({
  nodeId,
  ghostRef,
  isHydrated = true,
  isInteractionEnabled = true,
  sizingMode,
  currentWidth,
  currentHeight,
  text,
  level,
  liveText,
  paddingX = 16, // matches "px-2" (8 each side)
  paddingY = 8, // matches "p-1" (4 top + 4 bottom)
  borderTotal = 2, // 1px on each side
}: UseTitleNodeSizingArgs) {
  const { canvasId } = useParams({ from: "/canvas/$canvasId" }) as {
    canvasId: Id<"canvases">;
  };
  const { setNodes } = useReactFlow();
  const updateDimensions = useMutation(
    api.canvasNodes.updatePositionOrDimensions,
  ).withOptimisticUpdate(
    (localStore, { canvasId: targetCanvasId, nodeChanges }) => {
      const existing = localStore.getQuery(api.canvases.readCanvas, {
        canvasId: targetCanvasId,
      });
      if (!existing || !existing.nodes) return;
      const changeById = new Map<string, { width: number; height: number }>();
      for (const change of nodeChanges as Array<{
        id: string;
        dimensions?: { width: number; height: number };
      }>) {
        if (change.dimensions) {
          changeById.set(change.id, change.dimensions);
        }
      }
      if (changeById.size === 0) return;
      localStore.setQuery(
        api.canvases.readCanvas,
        { canvasId: targetCanvasId },
        {
          ...existing,
          nodes: existing.nodes.map((node) => {
            const dim = changeById.get(node.id);
            if (!dim) return node;
            return { ...node, width: dim.width, height: dim.height };
          }),
        },
      );
    },
  );

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDimensions = useRef<{ width: number; height: number } | null>(
    null,
  );
  // Tracks the last (width, height) we asked Convex to persist. Lets us
  // short-circuit re-measures that would commit the same value again — which
  // can happen when external triggers (font loading, the ResizeObserver
  // forwarding our own setNodes back through handleNodeChange, query
  // invalidations on neighbouring data) re-run the measurement effect even
  // though nothing actually changed. Without this guard, a freshly-loaded
  // canvas can spam updatePositionOrDimensions in a loop.
  const lastPersistedRef = useRef<{ width: number; height: number } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      pendingAutoSizeIds.delete(nodeId);
      logTitleSizing(nodeId, "cleanup");
    };
  }, [nodeId]);

  const persistDimensions = (width: number, height: number) => {
    const last = lastPersistedRef.current;
    if (last && last.width === width && last.height === height) {
      logTitleSizing(nodeId, "persist-skipped-same-as-last", {
        width,
        height,
      });
      return;
    }
    pendingAutoSizeIds.add(nodeId);
    pendingDimensions.current = { width, height };
    logTitleSizing(nodeId, "persist-scheduled", {
      width,
      height,
      debounceMs: PERSIST_DEBOUNCE_MS,
    });
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      pendingAutoSizeIds.delete(nodeId);
      const dim = pendingDimensions.current;
      pendingDimensions.current = null;
      debounceTimer.current = null;
      if (!dim) return;
      lastPersistedRef.current = dim;
      logTitleSizing(nodeId, "persist-commit-mutation", {
        width: dim.width,
        height: dim.height,
      });
      void updateDimensions({
        canvasId,
        nodeChanges: [
          {
            id: nodeId,
            dimensions: dim,
          },
        ],
      });
    }, PERSIST_DEBOUNCE_MS);
  };

  // Apply locally first so the React Flow node grows in the same frame as the
  // user's input. The optimistic mutation will catch up shortly after.
  const applyLocalDimensions = (width: number, height: number) => {
    logTitleSizing(nodeId, "apply-local-dimensions", {
      width,
      height,
    });
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              width,
              height,
              measured: { width, height },
            }
          : node,
      ),
    );
  };

  // Measure & sync whenever the relevant inputs change.
  useLayoutEffect(() => {
    if (!isHydrated) {
      logTitleSizing(nodeId, "measure-skipped-not-hydrated");
      return;
    }

    if (!isInteractionEnabled) {
      logTitleSizing(nodeId, "measure-skipped-no-user-interaction");
      return;
    }

    const ghost = ghostRef.current;
    if (!ghost) return;

    logTitleSizing(nodeId, "measure-start", {
      sizingMode,
      currentWidth,
      currentHeight,
      textLength: (liveText ?? text).length,
      level,
    });

    if (sizingMode === "auto") {
      // Single-line measurement
      ghost.style.whiteSpace = "pre";
      ghost.style.width = "auto";
      const naturalWidth = ghost.offsetWidth;
      const naturalHeight = ghost.offsetHeight;
      const desiredWidth = Math.ceil(naturalWidth + paddingX + borderTotal);
      const desiredHeight = Math.ceil(naturalHeight + paddingY + borderTotal);

      if (
        Math.abs(desiredWidth - currentWidth) > MIN_DELTA ||
        Math.abs(desiredHeight - currentHeight) > MIN_DELTA
      ) {
        logTitleSizing(nodeId, "measure-auto-delta", {
          desiredWidth,
          desiredHeight,
          currentWidth,
          currentHeight,
        });
        applyLocalDimensions(desiredWidth, desiredHeight);
        persistDimensions(desiredWidth, desiredHeight);
      } else {
        logTitleSizing(nodeId, "measure-auto-noop", {
          desiredWidth,
          desiredHeight,
          currentWidth,
          currentHeight,
        });
      }
    } else {
      // Manual mode: width is fixed by the user; we only adapt height to wrap.
      const innerWidth = Math.max(0, currentWidth - paddingX - borderTotal);
      ghost.style.whiteSpace = "pre-wrap";
      ghost.style.width = `${innerWidth}px`;
      const wrappedHeight = ghost.offsetHeight;
      const desiredHeight = Math.ceil(wrappedHeight + paddingY + borderTotal);

      if (Math.abs(desiredHeight - currentHeight) > MIN_DELTA) {
        logTitleSizing(nodeId, "measure-manual-delta", {
          currentWidth,
          desiredHeight,
          currentHeight,
          innerWidth,
        });
        applyLocalDimensions(currentWidth, desiredHeight);
        persistDimensions(currentWidth, desiredHeight);
      } else {
        logTitleSizing(nodeId, "measure-manual-noop", {
          currentWidth,
          desiredHeight,
          currentHeight,
          innerWidth,
        });
      }
    }
    // Depend on currentHeight too: when React Flow's resizer or the convex
    // sync overwrites our height (e.g. on resize release, the resizer's
    // dimension change persists the start height to convex even with
    // resizeDirection="horizontal"), this re-runs and overrides height back
    // to the wrap-computed value. liveText is also a dependency so the node
    // grows on every keystroke. eslint-disabled because applyLocal/persist
    // are stable closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    text,
    liveText,
    level,
    sizingMode,
    currentWidth,
    currentHeight,
    isHydrated,
    isInteractionEnabled,
    nodeId,
  ]);
}
