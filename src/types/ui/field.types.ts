import type { IconType } from "react-icons/lib";

// Props communes à tous les field components
export interface BaseFieldProps<T = any> {
  field?: import("../domain/nodeTypes").NodeField;
  value?: T;
  visualType?: "node" | "window";
  onChange?: (value: T) => void; // undefined = preview (pas de sauvegarde)
  visualSettings?: Record<string, unknown>; // Provient de layout.visual.settings
  componentProps?: Record<string, unknown>; // Props supplémentaires passées au composant
}

export interface FieldDefinition {
  label: string;
  icon: IconType;
  description?: string;
  type: FieldType;

  // Options configurables par l'utilisateur pour ce champ (colonnes)
  // Ex: pour un select : { options: [ "option1", "option2" ] }
  // Indépendant du visual choisi
  fieldOptions?: FieldSettingOption[];

  // Définition des composants et settings visuels
  visuals?: {
    commonSettingsList?: FieldSettingOption[]; // Settings communs à tous les variants
    variants: FieldVisualVariant[];
  };
}

// Un variant de visuel pour un field
export interface FieldVisualVariant {
  name: string; // "default", "compact", "detailed", etc.
  label: string; // Nom affiché dans l'UI
  description?: string; // Description du variant
  icon?: React.ComponentType; // Icône optionnelle pour le variant
  visualType: "node" | "window" | "both";
  style?: React.CSSProperties; // Styles CSS spécifiques pour ce variant
  component: React.ComponentType<BaseFieldProps>;
  componentProps?: Record<string, unknown>; // Props supplémentaires passées au composant
  settingsList?: FieldSettingOption[]; // Settings spécifiques à ce variant
}

// Définition d'une option de configuration (utilisé pour fieldOptions et settingsList)
export interface FieldSettingOption {
  key: string;
  label: string;
  type: "input" | "boolean" | "toggleGroup" | "selectBuilder" | "select";
  props?: Record<string, unknown>;
  defaultValue?: unknown; // Valeur par défaut pour ce setting
}

export type FieldType =
  | "short_text"
  | "url"
  | "select"
  | "image"
  | "image_url"
  | "number"
  | "date"
  | "rich_text"
  | "boolean"
  | "file"
  | "document";
