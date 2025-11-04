// ===========================================================================
// Node Template Types
// ===========================================================================

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
  | "short_text"
  | "url"
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
  visual?: string; // Ici, ça indique quel component on utilisera dans les node renderers
  style?: Record<string, unknown>;
  children?: LayoutElement[];
}

// ===========================================================================
// Nodes on the canvas
// ===========================================================================

// Made for react flow
export interface CanvasNode {
  id: string;
  name?: string;
  type: string;
  templateId?: string;
  position: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
  zIndex?: number;
  color: string;
  locked: boolean;
  hidden: boolean;
  data: Record<string, unknown>;
  parentId?: string;
  extent?: any | null; //  "parent" | [[number, number], [number, number]]
  extendParent?: boolean;

  // ====== React Flow metadata, not stored in DB
  resizing?: boolean;
  dragging?: boolean;
  selected?: boolean;
  // Adapted from locked
  focusable?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
}
