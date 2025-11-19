import { memo, useCallback } from "react";
import type { BaseFieldProps } from "@/types/field.types";
import InlineEditableText from "../form-ui/InlineEditableText";

// TextField component pour le type "short_text"
// Toujours éditable, avec ou sans sauvegarde selon si onChange est fourni
function TextField({ field, value, onChange, visualSettings }: BaseFieldProps) {
  const handleSave = useCallback(
    (newValue: string) => {
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const showLabel = visualSettings?.showLabel as boolean | undefined;
  const displayAs = (field.options?.displayAs as string) || "p";
  const textValue = (value as string) || "";
  const placeholder =
    (field.options?.placeholder as string) || `Éditer ${field.name}...`;

  return (
    <div className="space-y-1">
      {showLabel && (
        <label className="text-xs font-medium text-gray-600">
          {field.name}
        </label>
      )}
      <InlineEditableText
        value={textValue}
        onSave={handleSave}
        placeholder={placeholder}
        className={getTextClassName(displayAs)}
      />
    </div>
  );
}

// Helper pour obtenir les classes CSS selon le displayAs
function getTextClassName(displayAs: string): string {
  switch (displayAs) {
    case "h1":
      return "text-2xl font-semibold";
    case "h2":
      return "text-xl font-semibold";
    case "h3":
      return "text-lg font-semibold";
    case "p":
    default:
      return "text-base";
  }
}

export default memo(TextField);
