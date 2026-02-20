import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  type JSX,
} from "react";
import { cn } from "@/lib/utils";
import get from "lodash/get";
import { useFormikContextSafe } from "@/hooks/useFormikContextSafe";

interface InlineEditableTextProps {
  /**
   * La valeur du texte à afficher et éditer
   */
  value?: string;
  disabled?: boolean;

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

  /**
   * Si true, utilise un textarea au lieu d'un input (pour le texte multiligne)
   * @default false
   */
  multiline?: boolean;

  /**
   * Nombre minimum de lignes pour le textarea (uniquement si multiline=true)
   * @default 1
   */
  minRows?: number;
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
  placeholder = "Click to edit...",
  saveOnBlur = true,
  as: Element = "span",
  disabled = false,
  multiline = false,
  minRows = 1,
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Récupérer le contexte Formik de manière sûre (undefined si pas dans un contexte Formik)
  // NOTE: On appelle toujours le hook, respectant ainsi la règle des hooks React
  const formikContext = useFormikContextSafe<any>();

  // Déterminer la valeur actuelle (Formik ou externe)
  const currentValue =
    name && formikContext
      ? (get(formikContext.values, name) as string) || ""
      : externalValue || "";

  useEffect(() => {
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      } else if (!multiline && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline]);

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
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // En mode multiline, Enter crée une nouvelle ligne au lieu de sauvegarder
      // Utiliser Ctrl+Enter ou Cmd+Enter pour sauvegarder
      if (e.key === "Enter" && (!multiline || e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel, multiline]
  );

  const handleBlur = useCallback(() => {
    if (saveOnBlur) {
      handleSave();
    }
  }, [saveOnBlur, handleSave]);

  return (
    <div
      className={cn("inline-grid", className)}
      style={{ gridTemplateColumns: "1fr" }}
    >
      {/* Élément invisible qui maintient la largeur */}
      <Element
        className={cn(
          "invisible col-start-1 row-start-1",
          multiline ? "whitespace-pre-wrap" : "whitespace-normal",
          !currentValue && "text-muted-foreground/50 italic"
        )}
        aria-hidden="true"
      >
        {(isEditing ? editValue : currentValue) || placeholder}
      </Element>

      {isEditing ? (
        multiline ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={minRows}
            className={cn(
              "col-start-1 row-start-1 bg-transparent border-none outline-none nodrag resize-none",
              inputClassName
            )}
            style={{
              font: "inherit",
              padding: 0,
              margin: 0,
              overflow: "hidden",
            }}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              "col-start-1 row-start-1 bg-transparent border-none outline-none nodrag",
              inputClassName
            )}
            style={{
              font: "inherit",
              padding: 0,
              margin: 0,
            }}
          />
        )
      ) : (
        <Element
          className={cn(
            "col-start-1 row-start-1 cursor-text",
            multiline && "whitespace-pre-wrap",
            !currentValue && "text-muted-foreground/50 italic"
          )}
          onDoubleClick={(e) => {
            if (disabled) return;
            e.stopPropagation();
            handleStartEdit();
          }}
        >
          {currentValue || placeholder}
        </Element>
      )}
    </div>
  );
}

export default memo(InlineEditableText);
