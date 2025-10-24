import {
  HiMinus,
  HiOutlineBars3BottomLeft,
  HiOutlinePhoto,
} from "react-icons/hi2";
import type { FieldType } from "../../types/node.types";

export interface FieldDefinition {
  type: FieldType;
  label: string;
  description: string;
  icon?: React.ComponentType<any>;
  settings?: Record<string, unknown>;
  nodeVisualComponents: Record<string, string>;
  windowVisualComponents: Record<string, string>;
}

const fieldDefinitions: FieldDefinition[] = [
  {
    type: "short_text",
    label: "Texte court", // Appelation du champ visible pour le user
    description: "Texte court sans mise en forme.", // Visible pour le user
    icon: HiMinus,
    settings: {},
    nodeVisualComponents: {
      default: "",
    },
    windowVisualComponents: {
      default: "",
    },
  },
  {
    type: "rich_text",
    label: "Texte enrichi", // Appelation du champ visible pour le user
    description: "Textes longs avec mise en forme.", // Visible pour le user
    icon: HiOutlineBars3BottomLeft,
    settings: {},
    nodeVisualComponents: {
      default: "",
    },
    windowVisualComponents: {
      default: "",
    },
  },
  {
    type: "image_url",
    label: "Image URL",
    description: "Ajouter une image via une URL externe.",
    icon: HiOutlinePhoto,
    options: {},
    nodeVisualComponents: {
      default: "",
    },
    windowVisualComponents: {
      default: "",
    },
  },
] as const;

export { fieldDefinitions };
export type { FieldDefinition };
