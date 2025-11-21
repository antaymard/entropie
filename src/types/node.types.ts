// ===========================================================================
// Node Template Types
// ===========================================================================

import type { Id } from "convex/_generated/dataModel";
import type { FieldType } from "./field.types";

export interface NodeTemplate {
  _id: Id<"nodeTemplates"> | "new";
  _creationTime: number;
  name: string;
  description: string;
  icon: string;
  isSystem: boolean;
  creatorId?: string | null;

  // Définition des champs (colonnes)
  fields: NodeField[];

  // Layouts visuels pour node et window
  visuals: {
    node: Record<string, NodeVisual>;
    window: Record<string, NodeVisual>;
  };

  // Variants par défaut
  defaultVisuals: {
    node: string; // variant_id
    window: string; // variant_id
  };

  updatedAt: number;
}

export interface NodeField {
  id: string;
  name: string;
  type: FieldType;
  description?: string;
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
  data?: object; // Pour le type "text", contient le texte à afficher
  visual?: {
    name: string; // Ici, ça indique quel component on utilisera dans les node renderers
    settings?: Record<string, unknown>;
  };
  style?: Record<string, unknown>;
  children?: LayoutElement[];
}

// ===========================================================================
// Nodes on the canvas
// ===========================================================================

export type NodeType = "default" | "floatingText" | "custom";

// Convex format
export interface CanvasNode {
  id: string; // Pas _id car sous objet de canvas, qui lui un _id
  name: string;
  type: string;
  templateId?: string;
  position: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
  zIndex: number;
  color: NodeColors;
  locked: boolean;
  hidden: boolean;
  headerless?: boolean;

  data: Record<string, unknown>; // Données du node, qu'on pourra un jour sortir sur une table dédiée

  parentId?: string;
  extent?: any | null; //  "parent" | [[number, number], [number, number]]
  extendParent?: boolean;
}

export type NodeColors =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "transparent"
  | "default";

export interface NodeConfig {
  nodeLabel: string;
  nodeIcon: string;
  type: NodeType;
  component: React.ComponentType<any>;

  // Proche du format CanvasNode, sans id, position, templateId
  initialNodeValues: CanvasNode;

  // Pour le resizer
  minWidth: number;
  minHeight: number;
  disableDoubleClickToOpenWindow?: boolean;
  canSwitchHeaderless?: boolean;
  canBeTransparent?: boolean;
}
