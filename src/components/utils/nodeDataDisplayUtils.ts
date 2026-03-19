import type { Doc } from "@/../convex/_generated/dataModel";
import type { IconType } from "react-icons";
import prebuiltNodesConfig from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
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

export function getNodeDataTitle(nodeData: Doc<"nodeDatas">): string {
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

const NODE_TYPE_ICON_MAP: Record<string, IconType> = prebuiltNodesConfig.reduce<
  Record<string, IconType>
>((acc, config) => {
  const nodeType = config.node.type;

  if (typeof nodeType === "string") {
    acc[nodeType] = config.nodeIcon as IconType;
  }

  return acc;
}, {});

export function getNodeIcon(type: string | undefined): IconType | undefined {
  if (!type) return undefined;
  return NODE_TYPE_ICON_MAP[type];
}
