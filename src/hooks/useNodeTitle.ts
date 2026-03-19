import { useCallback } from "react";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import type { Doc, Id } from "@/../convex/_generated/dataModel";
import type { Value } from "platejs";

function getDocumentTitle(value: Value): string {
  if (!value || value.length === 0) return "Document";
  const firstBlock = value[0];
  if (firstBlock.type === "h1" || firstBlock.type === "h2") {
    return (
      firstBlock.children
        .map((child) => ("text" in child ? String(child.text) : ""))
        .join(" ") || "Document"
    );
  }
  return "Document";
}

export function getNodeTitle(nodeData: Doc<"nodeDatas">): string {
  switch (nodeData.type) {
    case "document":
      return getDocumentTitle(nodeData.values.doc as Value);
    case "link": {
      const link = nodeData.values.link as
        | { pageTitle?: string; href?: string }
        | undefined;
      return link?.pageTitle || link?.href || "Link";
    }
    case "embed": {
      const embed = nodeData.values.embed as { title?: string } | undefined;
      return embed?.title || "Embed";
    }
    case "value": {
      const val = nodeData.values.value as { label?: string } | undefined;
      return val?.label || "Value";
    }
    case "file": {
      const files = nodeData.values.files as { filename: string }[] | undefined;
      return files?.[0]?.filename || "File";
    }
    case "image": {
      const images = nodeData.values.images as
        | { filename?: string }[]
        | undefined;
      return images?.[0]?.filename || "Image";
    }
    default:
      return nodeData.type ?? "Node";
  }
}

export function useNodeTitle(
  nodeDataId: Id<"nodeDatas"> | undefined,
): string | undefined {
  return useNodeDataStore(
    useCallback(
      (state) => {
        if (!nodeDataId) return undefined;
        const nodeData = state.nodeDatas.get(nodeDataId);
        if (!nodeData) return undefined;
        return getNodeTitle(nodeData);
      },
      [nodeDataId],
    ),
  );
}
