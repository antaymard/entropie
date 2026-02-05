import { cn } from "@/lib/utils";
import { useWindowsStore } from "@/stores/windowsStore";
import DocumentWindow from "./prebuilt/DocumentWindow";
import { useReactFlow, type Node } from "@xyflow/react";

export default function WindowPanelsContainer() {
  const openWindows = useWindowsStore((state) => state.openWindows);
  const { getNode } = useReactFlow();

  if (openWindows.length === 0) return null;

  const window = openWindows[0];
  const node = getNode(window) as Node;

  function renderWindowPanel() {
    if (!node?.type) return null;
    switch (node.type) {
      case "document":
        return <DocumentWindow xyNode={node} />;
    }
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 bottom-0 md:p-3 w-full md:max-w-[650px] z-10"
      )}
    >
      {renderWindowPanel()}
    </div>
  );
}
