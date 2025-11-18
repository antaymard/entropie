import { memo, useCallback } from "react";
import { get, set } from "lodash";
import { useFormikContextSafe } from "@/hooks/useFormikContextSafe";
import { ToggleGroup, ToggleGroupItem } from "../shadcn/toggle-group";
import { cn } from "@/lib/utils";
import { Label } from "../shadcn/label";

interface ToggleOption {
  value: string;
  label?: string;
  icon?: React.ReactNode;
}

interface TogglesBaseProps {
  /**
   * Nom du champ Formik (si utilisé dans un contexte Formik)
   */
  name?: string;

  /**
   * Options disponibles pour le toggle group
   */
  options: ToggleOption[];

  /**
   * Label à afficher au dessus du toggle group
   */
  label?: string;

  /**
   * Variante visuelle du toggle group
   * @default "outline"
   */
  variant?: "default" | "outline";

  /**
   * Classes CSS pour le wrapper
   */
  className?: string;

  /**
   * Désactiver tous les toggles
   */
  disabled?: boolean;
}

interface TogglesSingleProps extends TogglesBaseProps {
  /**
   * Type de sélection single
   */
  type?: "single";

  /**
   * La valeur sélectionnée (uniquement en mode non-Formik)
   */
  value?: string;

  /**
   * Callback appelé lors du changement (uniquement en mode non-Formik)
   */
  onChange?: (value: string) => void;
}

interface TogglesMultipleProps extends TogglesBaseProps {
  /**
   * Type de sélection multiple
   */
  type: "multiple";

  /**
   * Les valeurs sélectionnées (uniquement en mode non-Formik)
   */
  value?: string[];

  /**
   * Callback appelé lors du changement (uniquement en mode non-Formik)
   */
  onChange?: (value: string[]) => void;
}

type TogglesProps = TogglesSingleProps | TogglesMultipleProps;

/**
 * Composant Toggles (ToggleGroup) qui fonctionne avec ou sans Formik
 *
 * Fonctionnalités:
 * - Compatible Formik (utiliser prop `name`)
 * - Compatible mode standalone (utiliser props `value` et `onChange`)
 * - Support de plusieurs options avec icônes ou labels
 * - Support du mode single ou multiple
 * - Support de l'état désactivé
 *
 * @example
 * // Avec Formik
 * <Toggles
 *   name="level"
 *   options={[
 *     { value: "h1", icon: <H1Icon /> },
 *     { value: "h2", icon: <H2Icon /> },
 *     { value: "h3", icon: <H3Icon /> },
 *   ]}
 * />
 *
 * @example
 * // Sans Formik
 * <Toggles
 *   value={selectedLevel}
 *   onChange={(newValue) => setSelectedLevel(newValue)}
 *   options={[
 *     { value: "small", label: "S" },
 *     { value: "medium", label: "M" },
 *     { value: "large", label: "L" },
 *   ]}
 * />
 */
function Toggles(props: TogglesProps) {
  const {
    value: externalValue,
    onChange,
    name,
    options,
    type = "single",
    variant = "outline",
    className,
    disabled = false,
    label,
  } = props;

  // Récupérer le contexte Formik de manière sûre (undefined si pas dans un contexte Formik)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formikContext = useFormikContextSafe<any>();

  // Déterminer la valeur actuelle (Formik ou externe)
  const currentValue =
    name && formikContext
      ? (get(formikContext.values, name) as string | string[])
      : externalValue;

  const handleValueChange = useCallback(
    (newValue: string | string[]) => {
      // Si on utilise Formik
      if (name && formikContext) {
        const newValues = { ...formikContext.values };
        set(newValues, name, newValue);
        formikContext.setValues(newValues);
      }
      // Sinon on appelle le callback externe
      else if (onChange) {
        // Type-safe callback based on type
        if (type === "multiple") {
          (onChange as (value: string[]) => void)(newValue as string[]);
        } else {
          (onChange as (value: string) => void)(newValue as string);
        }
      }
    },
    [name, formikContext, onChange, type]
  );

  // Props communes pour les deux types
  const commonProps = {
    variant,
    className: cn("bg-card", className),
    onValueChange: handleValueChange,
    disabled,
  };

  const items = options.map((option) => (
    <ToggleGroupItem key={option.value} value={option.value}>
      {option.icon || option.label || option.value}
    </ToggleGroupItem>
  ));

  // Render conditionnel basé sur le type pour satisfaire TypeScript
  if (type === "multiple") {
    return (
      <div className="space-y-2">
        {label && <Label>{props.label}</Label>}
        <ToggleGroup
          {...commonProps}
          type="multiple"
          value={currentValue as string[]}
        >
          {items}
        </ToggleGroup>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label>{props.label}</Label>}
      <ToggleGroup
        {...commonProps}
        type="single"
        value={currentValue as string}
      >
        {items}
      </ToggleGroup>
    </div>
  );
}

export default memo(Toggles);
