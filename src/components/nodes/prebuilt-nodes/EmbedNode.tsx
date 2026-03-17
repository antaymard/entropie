import { memo, useState } from "react";
import type { Node } from "@xyflow/react";
import { areNodePropsEqual } from "../areNodePropsEqual";
import NodeFrame from "../NodeFrame";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { TbCode, TbPencil } from "react-icons/tb";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import { useNodeDataValues } from "@/hooks/useNodeData";
import type { Id } from "@/../convex/_generated/dataModel";

type EmbedType =
  | "youtube"
  | "google-docs"
  | "google-sheets"
  | "google-slides"
  | "generic";

export type EmbedValueType = {
  url: string;
  embedUrl: string;
  title?: string;
  type: EmbedType;
};

function resolveEmbedUrl(rawUrl: string): { embedUrl: string; type: EmbedType } {
  let url = rawUrl.trim();
  if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    // YouTube: youtube.com/watch?v=ID ou youtu.be/ID
    if (host === "youtube.com" || host === "youtu.be") {
      let videoId: string | null = null;
      if (host === "youtu.be") {
        videoId = parsed.pathname.slice(1);
      } else {
        videoId = parsed.searchParams.get("v");
      }
      if (videoId) {
        return {
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          type: "youtube",
        };
      }
    }

    // Google Docs
    if (host === "docs.google.com") {
      const path = parsed.pathname;

      if (path.includes("/document/")) {
        const match = path.match(/\/document\/d\/([^/]+)/);
        if (match) {
          return {
            embedUrl: `https://docs.google.com/document/d/${match[1]}/preview`,
            type: "google-docs",
          };
        }
      }

      if (path.includes("/spreadsheets/")) {
        const match = path.match(/\/spreadsheets\/d\/([^/]+)/);
        if (match) {
          return {
            embedUrl: `https://docs.google.com/spreadsheets/d/${match[1]}/preview`,
            type: "google-sheets",
          };
        }
      }

      if (path.includes("/presentation/")) {
        const match = path.match(/\/presentation\/d\/([^/]+)/);
        if (match) {
          return {
            embedUrl: `https://docs.google.com/presentation/d/${match[1]}/embed`,
            type: "google-slides",
          };
        }
      }
    }
  } catch {
    // URL invalide, on passe en générique
  }

  return { embedUrl: url, type: "generic" };
}

function EmbedNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const { updateNodeDataValues } = useUpdateNodeDataValues();

  const [inputUrl, setInputUrl] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const embedValue = values?.embed as EmbedValueType | undefined;

  const handleSave = () => {
    if (!nodeDataId || !inputUrl.trim()) return;

    const { embedUrl, type } = resolveEmbedUrl(inputUrl);

    updateNodeDataValues({
      nodeDataId,
      values: {
        embed: {
          url: inputUrl.trim(),
          embedUrl,
          title: inputTitle.trim() || undefined,
          type,
        },
      },
    });
    setIsPopoverOpen(false);
    setInputUrl("");
    setInputTitle("");
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setInputUrl(embedValue?.url ?? "");
      setInputTitle(embedValue?.title ?? "");
    }
  };

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title="Edit embed URL">
              <TbPencil />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex flex-col gap-2">
              <Input
                onDoubleClick={(e) => e.stopPropagation()}
                type="text"
                placeholder="https://..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
              <Input
                onDoubleClick={(e) => e.stopPropagation()}
                type="text"
                placeholder="Title (optional)"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
              />
              <Button onClick={handleSave} size="sm" disabled={!inputUrl.trim()}>
                Save
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode} resizable>
        {embedValue?.embedUrl ? (
          <iframe
            src={embedValue.embedUrl}
            title={embedValue.title ?? "Embedded content"}
            className="w-full h-full border-0 rounded"
            allow="autoplay; fullscreen; clipboard-read; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground select-none">
            <TbCode size={28} />
            <span className="text-sm">Paste a URL to embed</span>
          </div>
        )}
      </NodeFrame>
    </>
  );
}

export default memo(EmbedNode, areNodePropsEqual);
