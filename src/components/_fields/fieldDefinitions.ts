import {
  HiMinus,
  HiOutlineBars3BottomLeft,
  HiOutlinePhoto,
  HiOutlineCheckCircle,
  HiGlobeEuropeAfrica,
} from "react-icons/hi2";
import type { FieldType } from "../../types/node.types";

import TextInput from "../form-ui/TextInput";
import Toggle from "../form-ui/Toggle";
import Selector from "../form-ui/Selector";

interface FieldDefinition {
  type: FieldType;
  label: string;
  description: string;
  icon?: React.ComponentType<any>;
  settings?: Array<{
    name: string;
    label: string;
    component: React.ComponentType<any>;
    description: string;
    defaultValue: string | number | boolean;
  }>;
  nodeVisualComponents: Record<string, string>;
  windowVisualComponents: Record<string, string>;
}

const fieldDefinitions: FieldDefinition[] = [
  {
    type: "short_text",
    label: "Texte", // Appelation du champ visible pour le user
    description: "Texte court sans mise en forme.", // Visible pour le user
    icon: HiMinus,
    settings: [],
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
    nodeVisualComponents: {
      default: "",
    },
    windowVisualComponents: {
      default: "",
    },
  },
  {
    type: "boolean",
    label: "Checkbox",
    description: "Un case à cocher.", // Visible pour le user
    icon: HiOutlineCheckCircle,
    settings: [],
    nodeVisualComponents: {
      default: "",
    },
    windowVisualComponents: {
      default: "",
    },
  },
  {
    type: "url",
    label: "Lien URL",
    description: "Ajouter un lien URL.",
    icon: HiGlobeEuropeAfrica,
    settings: [],
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
