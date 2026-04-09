import { cn } from "@/lib/utils";
import { useWindowsStore } from "@/stores/windowsStore";
import DocumentWindow from "./prebuilt/DocumentWindow";
import PdfWindow from "./prebuilt/PdfWindow";
import { useReactFlow, type Node } from "@xyflow/react";

export default function WindowPanelsContainer() {
  const openedWindows = useWindowsStore((state) => state.openedWindows);
  const { getNode } = useReactFlow();

  if (openedWindows.length === 0) return null;

  const window = openedWindows[0];
  const node = getNode(window.xyNodeId) as Node;

  function renderWindowPanel() {
    if (!node?.type) return null;
    switch (node.type) {
      case "document":
        return <DocumentWindow key={node.id} xyNode={node} />;
      case "file":
      case "pdf":
        return <PdfWindow xyNode={node} />;
    }
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 bottom-0 md:p-3 w-full md:max-w-[650px] z-10",
      )}
    >
      {renderWindowPanel()}
    </div>
  );
}
