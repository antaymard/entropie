import { cn } from "@/lib/utils";
import { useWindowsStore } from "@/stores/windowsStore";
import { useStore } from "@xyflow/react";
import WindowFrame from "./WindowFrame";

export default function WindowsContainer() {
  const openedWindows = useWindowsStore((s) => s.openedWindows);
  const existingNodeIds = useStore((state) =>
    state.nodes.map((node) => node.id),
  );

  return (
    <div
      data-slot="windows-container"
      className="pointer-events-none fixed inset-0 z-10 h-full w-full"
    >
      {openedWindows
        .filter((openedWindow) =>
          existingNodeIds.includes(openedWindow.xyNodeId),
        )
        .map((openedWindow) => (
          <div
            key={openedWindow.xyNodeId}
            className={cn(
              "pointer-events-auto absolute",
              openedWindow.windowState === "minimized" && "hidden",
            )}
            style={{
              left: openedWindow.position.x,
              top: openedWindow.position.y,
              width: openedWindow.width,
              height: openedWindow.height,
            }}
          >
            <WindowFrame openedWindow={openedWindow} />
          </div>
        ))}
    </div>
  );
}
