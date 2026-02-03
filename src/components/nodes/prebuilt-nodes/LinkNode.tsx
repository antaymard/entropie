import { memo, useState } from "react";
import type { Node } from "@xyflow/react";
import NodeFrame from "../NodeFrame";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { TbLink, TbExternalLink } from "react-icons/tb";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import { useNodeDataValues } from "@/hooks/useNodeData";
import type { Id } from "@/../convex/_generated/dataModel";
import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import toast from "react-hot-toast";

export type LinkValueType = {
  href: string;
  pageTitle: string;
  pageImage?: string;
  pageDescription?: string;
  siteName?: string;
};

const defaultValue: LinkValueType = {
  href: "",
  pageTitle: "",
};

function LinkNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const { updateNodeDataValues } = useUpdateNodeDataValues();

  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const fetchLinkMetadata = useAction(api.links.fetchLinkMetadata);

  const linkValue = (values?.link as LinkValueType | undefined) ?? defaultValue;

  const handleSave = async () => {
    if (!nodeDataId) return;

    let url = linkUrl.trim();

    // Ajouter https:// si absent
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // Valider le format URL
    try {
      new URL(url);
    } catch {
      toast.error("L'URL n'est pas valide");
      return;
    }

    // Récupérer le titre de la page via l'API
    setIsLoading(true);
    try {
      const metadata = await fetchLinkMetadata({ url });

      updateNodeDataValues({
        nodeDataId,
        values: {
          link: {
            href: url,
            pageTitle: linkTitle.trim() || metadata.title || url,
            pageImage: metadata.image || "",
            pageDescription: metadata.description || "",
            siteName: "",
          },
        },
      });
      setIsPopoverOpen(false);
      setLinkUrl("");
      setLinkTitle("");
    } catch {
      toast.error("Impossible de récupérer le titre de la page");
      // Sauvegarder quand même avec l'URL comme titre
      updateNodeDataValues({
        nodeDataId,
        values: { link: { href: url, pageTitle: linkTitle.trim() || url } },
      });
      setIsPopoverOpen(false);
      setLinkUrl("");
      setLinkTitle("");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setLinkUrl(linkValue.href);
      setLinkTitle(linkValue.pageTitle);
    }
  };

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <TbLink />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex flex-col gap-2">
              <Input
                onDoubleClick={(e) => e.stopPropagation()}
                type="text"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <Input
                onDoubleClick={(e) => e.stopPropagation()}
                type="text"
                placeholder="Titre (optionnel)"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
              />
              <Button onClick={handleSave} disabled={isLoading} size="sm">
                {isLoading ? "Chargement..." : "Valider"}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode} resizable={false}>
        <div className="flex items-center gap-2 px-2 min-w-0 h-full group/linknode relative">
          {linkValue.href ? (
            <>
              <TbLink size={18} className="shrink-0" />
              <p className="truncate flex-1 min-w-0">
                {linkValue.pageTitle || <i>Pas de titre</i>}
              </p>
              <a
                href={linkValue.href}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/linknode:opacity-100 transition-opacity bg-background hover:bg-muted rounded-sm p-1 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <TbExternalLink size={16} />
              </a>
            </>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <TbLink size={18} className="shrink-0" />
              Pas de lien
            </span>
          )}
        </div>
      </NodeFrame>
    </>
  );
}

export default memo(LinkNode);
