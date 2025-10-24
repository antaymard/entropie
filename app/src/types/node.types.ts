export interface NodeTemplate {
  id?: string;
  name: string;
  description: string;
  icon: string;
  is_system: boolean;
  user_id: string | null;

  // Définition des champs (colonnes)
  fields: NodeField[];

  // Layouts visuels pour node et window
  visuals: {
    node: Record<string, NodeVisual>;
    window: Record<string, NodeVisual>;
  };

  // Variants par défaut
  default_visuals: {
    node: string; // variant_id
    window: string; // variant_id
  };
}

export type FieldType =
  | "url"
  | "short_text"
  | "select"
  | "image"
  | "image_url"
  | "number"
  | "date"
  | "rich_text"
  | "boolean";

export interface NodeField {
  id: string;
  name: string;
  type: FieldType;
  options?: Record<string, unknown>; // currency, placeholder, select options, etc.
}

export interface NodeVisual {
  name: string;
  description: string;
  layout: LayoutElement;
}

export interface LayoutElement {
  id: string; // Random if not field, field_id if field
  element: "root" | "div" | "field" | "separator" | "spacer" | "text" | "image";
  data?: string;
  visual?: string;
  style?: Record<string, unknown>;
  children?: LayoutElement[];
}
