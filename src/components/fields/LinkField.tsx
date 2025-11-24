import { useState, useEffect } from "react";
import type { BaseFieldProps } from "@/types/field.types";
import fieldsDefinition from "./fieldsDefinition";
import { TbPencil } from "react-icons/tb";
import { Input } from "../shadcn/input";
import { Label } from "../shadcn/label";
import { Button } from "../shadcn/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "../shadcn/sheet";

type LinkValueType = {
  href: string;
  pageTitle: string;
};

function LinkField({
  field,
  value,
  onChange,
}: BaseFieldProps<LinkValueType>) {
  const [editionPanelOpen, setEditionPanelOpen] = useState(false);
  const [linkHref, setLinkHref] = useState(value?.href || "");
  const [linkPageTitle, setLinkPageTitle] = useState(value?.pageTitle || "");

  // Sync local state with value prop when panel opens
  useEffect(() => {
    if (editionPanelOpen) {
      setLinkHref(value?.href || "");
      setLinkPageTitle(value?.pageTitle || "");
    }
  }, [editionPanelOpen, value?.href, value?.pageTitle]);

  const handleSave = () => {
    if (onChange) {
      onChange({
        href: linkHref,
        pageTitle: linkPageTitle,
      });
    }
    setEditionPanelOpen(false);
  };

  const handleCancel = () => {
    setEditionPanelOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setEditionPanelOpen(open);
  };

  const FieldDefinition = fieldsDefinition.find((f) => f.type === field.type);
  const linkValue: LinkValueType = (value as LinkValueType) || {
    href: "",
    pageTitle: "",
  };

  const Icon = FieldDefinition?.icon;

  return (
    <>
      <div className="relative hover:bg-gray-100 h-8 rounded-md flex justify-between items-center gap-2 group/linkfield">
        <div className="px-1 flex items-center gap-2">
          {Icon && <Icon size={18} />}
          {linkValue.pageTitle ? (
            <p>{linkValue.pageTitle}</p>
          ) : (
            <i>Pas de titre</i>
          )}
        </div>

        <button
          type="button"
          onClick={() => setEditionPanelOpen(true)}
          className="items-center justify-center h-8 w-8 group-hover/linkfield:flex hidden"
        >
          <TbPencil />
        </button>
      </div>

      <Sheet open={editionPanelOpen} onOpenChange={handleOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Éditer le lien</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-title">Titre du lien</Label>
              <Input
                id="link-title"
                type="text"
                placeholder="Titre de la page"
                value={linkPageTitle}
                onChange={(e) => setLinkPageTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkHref}
                onChange={(e) => setLinkHref(e.target.value)}
              />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default LinkField;
