// Props communes à tous les field components
export interface BaseFieldProps {
  field: import("./node.types").NodeField;
  value?: unknown;
  onChange?: (value: unknown) => void; // undefined = preview (pas de sauvegarde)
  visualSettings?: Record<string, unknown>; // Provient de layout.visual.settings
}

export interface FieldDefinition {
  label: string;
  icon: React.ComponentType;
  description?: string;
  type: FieldType;

  // Options configurables par l'utilisateur pour ce champ (colonnes)
  // Ex: pour un select : { options: [ "option1", "option2" ] }
  // Indépendant du visual choisi
  fieldOptions?: FieldSettingOption[];

  // Définition des composants et settings visuels pour node et window
  visuals?: {
    node: {
      default: FieldVisualConfig;
      commonSettingsList?: FieldSettingOption[]; // Settings communs à tous les visuals node
    };
    window: {
      default?: FieldVisualConfig;
      commonSettingsList?: FieldSettingOption[]; // Settings communs à tous les visuals window
    };
  };
}

// Configuration d'un visual pour un field
export interface FieldVisualConfig {
  component: React.ComponentType<BaseFieldProps>;
  settingsList?: FieldSettingOption[]; // Settings spécifiques à ce visual
}

// Définition d'une option de configuration (utilisé pour fieldOptions et settingsList)
export interface FieldSettingOption {
  key: string;
  label: string;
  type: "input" | "boolean" | "toggleGroup" | "selectBuilder" | "select";
  props?: Record<string, unknown>;
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
  | "boolean";
