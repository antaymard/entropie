import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  type JSX,
} from "react";
import { cn } from "@/lib/utils";
import { get } from "lodash";
import { useFormikContextSafe } from "@/hooks/useFormikContextSafe";

interface InlineEditableTextProps {
  /**
   * La valeur du texte à afficher et éditer
   */
  value?: string;

  /**
   * Callback appelé lors de la sauvegarde (uniquement en mode non-Formik)
   */
  onSave?: (value: string) => void;

  /**
   * Nom du champ Formik (si utilisé dans un contexte Formik)
   */
  name?: string;

  /**
   * Classes CSS pour le wrapper
   */
  className?: string;
  inputClassName?: string;

  /**
   * Placeholder quand le texte est vide
   */
  placeholder?: string;

  /**
   * Si true, sauvegarde automatiquement sur blur
   * @default true
   */
  saveOnBlur?: boolean;

  /**
   * Type d'élément HTML pour l'affichage (span, div, h1, h2, etc.)
   * @default "span"
   */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Composant de texte éditable en double-cliquant
 *
 * Fonctionnalités:
 * - Double-clic pour activer l'édition
 * - Enter pour sauvegarder
 * - Echap pour annuler
 * - Clic ailleurs pour sauvegarder (configurable avec saveOnBlur)
 * - Fonctionne avec ou sans Formik
 *
 * @example
 * // Avec Formik
 * <InlineEditableText name="nodeName" />
 *
 * @example
 * // Sans Formik
 * <InlineEditableText
 *   value={name}
 *   onSave={(newValue) => setName(newValue)}
 * />
 */
function InlineEditableText({
  value: externalValue,
  onSave,
  name,
  className,
  inputClassName,
  placeholder = "Cliquez pour éditer...",
  saveOnBlur = true,
  as: Element = "span",
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Récupérer le contexte Formik de manière sûre (undefined si pas dans un contexte Formik)
  // NOTE: On appelle toujours le hook, respectant ainsi la règle des hooks React
  const formikContext = useFormikContextSafe<any>();

  // Déterminer la valeur actuelle (Formik ou externe)
  const currentValue =
    name && formikContext
      ? (get(formikContext.values, name) as string) || ""
      : externalValue || "";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // OPTIMISATION: useCallback empêche la recréation des handlers à chaque render
  const handleStartEdit = useCallback(() => {
    setEditValue(currentValue);
    setIsEditing(true);
  }, [currentValue]);

  const handleSave = useCallback(() => {
    if (editValue !== currentValue) {
      // Si on utilise Formik
      if (name && formikContext) {
        // Utiliser setFieldValue au lieu de setValues pour forcer la mise à jour
        formikContext.setFieldValue(name, editValue);
      }
      // Sinon on appelle le callback externe
      else if (onSave) {
        onSave(editValue);
      }
    }
    setIsEditing(false);
  }, [editValue, currentValue, name, formikContext, onSave]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(currentValue);
  }, [currentValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    if (saveOnBlur) {
      handleSave();
    }
  }, [saveOnBlur, handleSave]);

  return (
    <div className={cn("inline-block", className)}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent border-none outline-none",
            inputClassName
          )}
          style={{
            font: "inherit",
            padding: 0,
            margin: 0,
          }}
        />
      ) : (
        <Element
          className={cn(
            "cursor-text",
            !currentValue && "text-muted-foreground/50 italic"
          )}
          onDoubleClick={handleStartEdit}
        >
          {currentValue || placeholder}
        </Element>
      )}
    </div>
  );
}

export default memo(InlineEditableText);
