import { memo, useCallback, useId, useMemo, useState } from "react";
import get from "lodash/get";
import { useFormikContextSafe } from "@/hooks/useFormikContextSafe";
import { Label } from "@/components/shadcn/label";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectorProps {
  /**
   * La valeur sélectionnée (uniquement en mode non-Formik)
   */
  value?: string;

  /**
   * Callback appelé lors du changement (uniquement en mode non-Formik)
   */
  onChange?: (value: string) => void;

  /**
   * Nom du champ Formik (si utilisé dans un contexte Formik)
   */
  name?: string;

  /**
   * Label à afficher au-dessus du sélecteur
   */
  label?: string;

  /**
   * Options disponibles
   */
  options: { value: string; label: string }[];

  /**
   * Texte affiché quand aucune option n'est sélectionnée
   */
  placeholder?: string;

  /**
   * Classes CSS pour le wrapper
   */
  className?: string;

  /**
   * Désactiver le sélecteur
   */
  disabled?: boolean;
}

/**
 * Composant Selector/Dropdown qui fonctionne avec ou sans Formik
 *
 * Fonctionnalités:
 * - Compatible Formik (utiliser prop `name`)
 * - Compatible mode standalone (utiliser props `value` et `onChange`)
 * - Support du label
 * - Support de l'état désactivé
 * - Style moderne avec shadcn/ui
 *
 * @example
 * // Avec Formik
 * <Selector
 *   name="country"
 *   label="Pays"
 *   options={[
 *     { value: "fr", label: "France" },
 *     { value: "us", label: "États-Unis" }
 *   ]}
 * />
 *
 * @example
 * // Sans Formik
 * <Selector
 *   value={selectedCountry}
 *   onChange={(newValue) => setSelectedCountry(newValue)}
 *   label="Pays"
 *   options={[
 *     { value: "fr", label: "France" },
 *     { value: "us", label: "États-Unis" }
 *   ]}
 * />
 */
function Selector({
  value: externalValue,
  onChange,
  name,
  label,
  options,
  placeholder = "Select...",
  className,
  disabled = false,
}: SelectorProps) {
  // Récupérer le contexte Formik de manière sûre (undefined si pas dans un contexte Formik)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formikContext = useFormikContextSafe<any>();

  // Déterminer la valeur actuelle (Formik ou externe)
  const currentValue =
    name && formikContext
      ? (get(formikContext.values, name) as string)
      : externalValue;

  const generatedId = useId();
  const id = `selector-${name || "standalone"}-${generatedId}`;

  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (newValue: string) => {
      // Si on utilise Formik
      if (name && formikContext) {
        formikContext.setFieldValue(name, newValue);
      }
      // Sinon on appelle le callback externe
      else if (onChange) {
        onChange(newValue);
      }
      setOpen(false);
    },
    [name, formikContext, onChange]
  );

  // Trouver le label de l'option sélectionnée
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === currentValue),
    [options, currentValue]
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label
          htmlFor={id}
          className={cn(disabled && "cursor-not-allowed opacity-50")}
        >
          {label}
        </Label>
      )}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              !currentValue && "text-muted-foreground"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
            <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-(--radix-dropdown-menu-trigger-width)">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => handleSelect(option.value)}
              className="cursor-pointer"
            >
              <CheckIcon
                className={cn(
                  "mr-2 h-4 w-4",
                  currentValue === option.value ? "opacity-100" : "opacity-0"
                )}
              />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default memo(Selector);
