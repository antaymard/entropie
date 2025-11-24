import { memo, useCallback, useId } from "react";
import { get } from "lodash";
import { useFormikContextSafe } from "@/hooks/useFormikContextSafe";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import { cn } from "@/lib/utils";

interface ToggleProps {
  /**
   * La valeur du toggle (uniquement en mode non-Formik)
   */
  value?: boolean;

  /**
   * Callback appelé lors du changement (uniquement en mode non-Formik)
   */
  onChange?: (value: boolean) => void;

  /**
   * Nom du champ Formik (si utilisé dans un contexte Formik)
   */
  name?: string;

  /**
   * Label à afficher à côté du toggle
   */
  label?: string;

  /**
   * Classes CSS pour le wrapper
   */
  className?: string;

  /**
   * Désactiver le toggle
   */
  disabled?: boolean;
}

/**
 * Composant Toggle/Switch qui fonctionne avec ou sans Formik
 *
 * Fonctionnalités:
 * - Compatible Formik (utiliser prop `name`)
 * - Compatible mode standalone (utiliser props `value` et `onChange`)
 * - Support du label
 * - Support de l'état désactivé
 *
 * @example
 * // Avec Formik
 * <Toggle name="isEnabled" label="Activer la fonctionnalité" />
 *
 * @example
 * // Sans Formik
 * <Toggle
 *   value={isEnabled}
 *   onChange={(newValue) => setIsEnabled(newValue)}
 *   label="Activer la fonctionnalité"
 * />
 */
function Toggle({
  value: externalValue,
  onChange,
  name,
  label,
  className,
  disabled = false,
}: ToggleProps) {
  // Récupérer le contexte Formik de manière sûre (undefined si pas dans un contexte Formik)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formikContext = useFormikContextSafe<any>();

  // Déterminer la valeur actuelle (Formik ou externe)
  const currentValue =
    name && formikContext
      ? ((get(formikContext.values, name) as boolean) ?? false)
      : (externalValue ?? false);

  const generatedId = useId();
  const id = `toggle-${name || "standalone"}-${generatedId}`;

  const handleToggle = useCallback(
    (newValue: boolean) => {
      // Si on utilise Formik
      if (name && formikContext) {
        // Utiliser setFieldValue pour garantir la réactivité
        formikContext.setFieldValue(name, newValue);
      }
      // Sinon on appelle le callback externe
      else if (onChange) {
        onChange(newValue);
      }
    },
    [name, formikContext, onChange]
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch
        id={id}
        checked={currentValue}
        onCheckedChange={handleToggle}
        disabled={disabled}
      />
      {label && (
        <Label
          htmlFor={id}
          className={cn(
            "cursor-pointer",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {label}
        </Label>
      )}
    </div>
  );
}

export default memo(Toggle);
