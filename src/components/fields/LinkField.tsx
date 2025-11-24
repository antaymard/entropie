import { useCallback, useRef, useState } from "react";
import type { BaseFieldProps } from "@/types/field.types";
import fieldsDefinition from "./fieldsDefinition";
import { TbPencil } from "react-icons/tb";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { Input } from "../shadcn/input";
import { Label } from "../shadcn/label";
import { Card } from "../shadcn/card";

type LinkValueType = {
  href: string;
  pageTitle: string;
};

function LinkField({
  field,
  value,
  onChange,
  visualSettings,
}: BaseFieldProps<LinkValueType>) {
  const [editing, setEditing] = useState(false);
  const [editionPanelOpen, setEditionPanelOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState(value?.href || "");

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
        className=" items-center justify-center h-8 w-8 group-hover/linkfield:flex hidden"
      >
        <TbPencil />
      </button>
      {!editionPanelOpen && (
        <Card className="absolute space-y-2 p-2 top-8 right-0 rounded border border-gray-300">
          <Label>Options</Label>
          <Input
            type="text"
            placeholder="Titre du lien"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
        </Card>
      )}
    </div>
  );
}

export default LinkField;
