import { useCallback, useContext, useRef, useState } from "react";
import type { BaseFieldProps } from "@/types/field.types";
import fieldsDefinition from "./fieldsDefinition";
import { TbPencil } from "react-icons/tb";
import { Input } from "../shadcn/input";
import { useNodeSidePanel } from "../nodes/side-panels/NodeSidePanelContext";
import { Button } from "../shadcn/button";
import SidePanelFrame from "../nodes/side-panels/SidePanelFrame";
import toast from "react-hot-toast";
import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";

type LinkValueType = {
  href: string;
  pageTitle: string;
  pageImage?: string;
  pageDescription?: string;
  siteName?: string;
};

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
    <SidePanelFrame id="linkEdition" title="Options du lien">
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

function LinkField({
  field,
  value,
  onChange,
  visualSettings,
}: BaseFieldProps<LinkValueType>) {
  const { closeSidePanel, openSidePanel } = useNodeSidePanel();

  const handleSave = useCallback(
    (newValue: LinkValueType) => {
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const FieldDefinition = fieldsDefinition.find((f) => f.type === field.type);
  const linkValue: LinkValueType = (value as LinkValueType) || {
    href: "",
    pageTitle: "",
  };

  const Icon = FieldDefinition?.icon;

  return (
    <div className="hover:bg-gray-100 h-8 rounded-md flex justify-between items-center gap-2 group/linkfield w-full">
      <a
        href={value?.href}
        target="_blank"
        className="px-1 flex items-center gap-2"
      >
        {Icon && <Icon size={18} />}
        {linkValue.pageTitle ? (
          <div className="flex truncate flex-1">
            <p>{linkValue.pageTitle}</p>
          </div>
        ) : (
          <i>Pas de titre</i>
        )}
      </a>

      <button
        type="button"
        onClick={() =>
          openSidePanel(
            "linkEdition",
            <LinkEditionContent
              initialValue={value?.href || ""}
              onSave={handleSave}
              onClose={() => closeSidePanel("linkEdition")}
            />
          )
        }
        className=" items-center justify-center h-8 w-8 group-hover/linkfield:flex hidden"
      >
        <TbPencil />
      </button>
    </div>
  );
}

export default LinkField;
