import { useFormikContext } from "formik";
import type { NodeTemplate } from "@/types/node.types";
import type { FieldVisualVariant } from "@/types/field.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../shadcn/dropdown-menu";
import { Button } from "../shadcn/button";
import { HiChevronDown, HiCheck } from "react-icons/hi2";
import { get } from "lodash";

interface VariantSelectorProps {
  elementPath: string; // path vers l'élément dans le layout
  variants: FieldVisualVariant[];
  visualType: "node" | "window";
}

export default function VariantSelector({
  elementPath,
  variants,
  visualType,
}: VariantSelectorProps) {
  const { values, setFieldValue } = useFormikContext<NodeTemplate>();

  // Récupérer le variant actuel
  const currentElement = get(values, elementPath);
  const currentVariantName = currentElement?.visual?.name || "default";

  // Filtrer les variants disponibles pour ce visualType
  const availableVariants = variants.filter(
    (v) => v.visualType === visualType || v.visualType === "both"
  );

  // Si un seul variant disponible, pas besoin de sélecteur
  if (availableVariants.length <= 1) {
    return null;
  }

  // Trouver le variant actuel
  const currentVariant = availableVariants.find(
    (v) => v.name === currentVariantName
  );

  const handleChange = (newVariantName: string) => {
    // Trouver le nouveau variant
    const newVariant = availableVariants.find((v) => v.name === newVariantName);
    if (!newVariant) return;

    // Construire les defaultSettings pour ce variant
    const defaultSettings: Record<string, unknown> = {};
    newVariant.settingsList?.forEach((setting) => {
      if (setting.defaultValue !== undefined) {
        defaultSettings[setting.key] = setting.defaultValue;
      }
    });

    // Mettre à jour le nom et les settings
    setFieldValue(`${elementPath}.visual.name`, newVariantName);
    setFieldValue(`${elementPath}.visual.settings`, defaultSettings);
  };

  const CurrentIcon = currentVariant?.icon;

  return (
    <div className="flex flex-col gap-1">
      {/* <label className="text-sm font-medium">Variant d'affichage</label> */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            type="button"
          >
            <div className="flex items-center gap-2">
              {CurrentIcon && <CurrentIcon />}
              <span>{currentVariant?.label || "Sélectionner un style"}</span>
            </div>
            <HiChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          {availableVariants.map((variant) => {
            const Icon = variant.icon;
            const isSelected = variant.name === currentVariantName;
            return (
              <DropdownMenuItem
                key={variant.name}
                onClick={() => handleChange(variant.name)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="text-gray-600">{Icon && <Icon />}</div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-sm">{variant.label}</span>
                    {variant.description && (
                      <span className="text-xs text-gray-500">
                        {variant.description}
                      </span>
                    )}
                  </div>
                  <div className="text-blue-600">
                    {isSelected && <HiCheck />}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
