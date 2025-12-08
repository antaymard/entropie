import { useCallback, useState } from "react";
import type { BaseFieldProps } from "@/types/field.types";
import { TbPencil, TbLink } from "react-icons/tb";
import { Input } from "../shadcn/input";
import { useNodeSidePanel } from "../nodes/side-panels/NodeSidePanelContext";
import { Button } from "../shadcn/button";
import SidePanelFrame from "../nodes/side-panels/SidePanelFrame";
import toast from "react-hot-toast";
import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { cn } from "@/lib/utils";

export type LinkValueType = {
  href: string;
  pageTitle: string;
  pageImage?: string;
  pageDescription?: string;
  siteName?: string;
};
const sidePanelId = "linkEdition";

function LinkEditionContent({
  initialValue,
  onSave,
  onClose,
}: {
  initialValue: string;
  onSave: (value: LinkValueType) => void;
  onClose: () => void;
}) {
  const [linkUrl, setLinkUrl] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const fetchLinkMetadata = useAction(api.links.fetchLinkMetadata);

  const handleSave = async () => {
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

      onSave({
        href: url,
        pageTitle: metadata.title || url,
        pageImage: metadata.image || "",
        pageDescription: metadata.description || "",
        siteName: metadata.site_name || "",
      });
      onClose();
    } catch (error) {
      toast.error("Impossible de récupérer le titre de la page");
      // Sauvegarder quand même avec l'URL comme titre
      onSave({ href: url, pageTitle: url });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidePanelFrame id={sidePanelId} title="Options du lien">
      <Input
        onDoubleClick={(e) => e.stopPropagation()}
        type="text"
        placeholder="https://..."
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
      />
      <Button onClick={handleSave} disabled={isLoading}>
        {isLoading ? "Chargement..." : "Valider"}
      </Button>
    </SidePanelFrame>
  );
}

interface LinkFieldProps extends BaseFieldProps<LinkValueType> {
  className?: string;
}

function LinkField({
  value,
  onChange,
  className = "",
  componentProps,
}: LinkFieldProps) {
  const { closeSidePanel, openSidePanel } = useNodeSidePanel();
  const { iconOnly } = componentProps || {};

  const handleSave = useCallback(
    (newValue: LinkValueType) => {
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const linkValue: LinkValueType = (value as LinkValueType) || {
    href: "",
    pageTitle: "",
  };

  return (
    <div
      className={cn(
        "relative bg-slate-100 hover:bg-slate-200 h-8 rounded-md flex items-center group/linkfield px-2 gap-2 min-w-0 ",
        iconOnly ? "w-8" : "flex-1 w-full",
        className
      )}
    >
      <a
        href={value?.href}
        target="_blank"
        className={`flex items-center gap-2 min-w-0 flex-1 cursor-pointer ${linkValue?.href ? "" : "opacity-50"} ${
          iconOnly ? "justify-center" : ""
        }`}
      >
        <TbLink size={18} className="shrink-0" />
        {!iconOnly && (
          <p className="truncate hover:underline flex-1 min-w-0">
            {linkValue?.href ? (
              linkValue.pageTitle || <i>Pas de titre</i>
            ) : (
              <i>Pas de lien</i>
            )}
          </p>
        )}
      </a>

      <button
        type="button"
        onClick={() =>
          openSidePanel(
            sidePanelId,
            <LinkEditionContent
              initialValue={value?.href || ""}
              onSave={handleSave}
              onClose={() => closeSidePanel(sidePanelId)}
            />
          )
        }
        className="absolute right-2 cursor-default hover:bg-black/5 rounded-sm items-center justify-center h-6 w-6 shrink-0 group-hover/linkfield:flex hidden"
      >
        <TbPencil />
      </button>
    </div>
  );
}

export default LinkField;
