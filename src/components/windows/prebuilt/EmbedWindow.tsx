import { memo } from "react";
import type { Id } from "@/../convex/_generated/dataModel";
import { useNodeDataValues } from "@/hooks/useNodeData";
import type { EmbedValueType } from "@/components/nodes/prebuilt-nodes/EmbedNode";

interface EmbedWindowProps {
  nodeDataId: Id<"nodeDatas">;
}

function EmbedWindow({ nodeDataId }: EmbedWindowProps) {
  const nodeDataValues = useNodeDataValues(nodeDataId);
  const embedValue = nodeDataValues?.embed as EmbedValueType | undefined;

  if (!nodeDataValues) return null;

  return embedValue?.embedUrl ? (
    <iframe
      src={embedValue.embedUrl}
      title={embedValue.title ?? "Embedded content"}
      className="h-full w-full border-0"
      allow="autoplay; fullscreen; clipboard-read; clipboard-write"
      allowFullScreen
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
    />
  ) : (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Aucun embed
    </div>
  );
}

export default memo(EmbedWindow);
